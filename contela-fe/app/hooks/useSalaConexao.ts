'use client';

import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import {
    AvisoVersao,
    buscarServidoresIce,
    criarClienteStomp,
    criarSala,
    entrarNaSala,
    enviarMensagem,
    enviarStatusCompartilhamento,
    expulsarParticipante,
    normalizarSalaId,
    pararCompartilhamentoDe,
} from '../lib/websocket';
import { DiagnosticoPeer } from '../lib/diagnostico';
import { ERRO_SEM_AUDIO, GerenciadorWebRTC } from '../lib/webrtc';
import { SalaResponse, MensagemResponse, SinalWebRTC, ChapeuEscolha } from '../types/sala';
import { EstadoServidor, estadoDoServidor, garantirServidor, observarServidor } from '../lib/servidor';
import { OpcoesCompartilhamento } from '../types/compartilhamento';
import { CORES_ESCOLHA, CHAPEUS_ESCOLHA } from '../lib/avatar';

const CHAVE_COR = 'contela:cor';
const CHAVE_CHAPEU = 'contela:chapeu';

function corPadraoAleatoria(): string {
    return CORES_ESCOLHA[Math.floor(Math.random() * CORES_ESCOLHA.length)];
}

export interface PreviaTransmissao {
    stream: MediaStream;
    opcoes: OpcoesCompartilhamento;
    nomeFonte: string | null;
    semAudio: boolean;
}

const TEMPO_AVISO_MS = 8000;
const TEMPO_LIMITE_ENTRADA_MS = 10000;

export function useSalaConexao() {
    const clientRef = useRef<Client | null>(null);
    const webrtcRef = useRef<GerenciadorWebRTC | null>(null);
    const meuIdRef = useRef<string | null>(null);
    const salaIdAtualRef = useRef<string | null>(null);
    const entradoRef = useRef(false);
    const sincronizadoRef = useRef(false);
    const compartilhandoRef = useRef(false);
    const participantesConhecidosRef = useRef<Set<string>>(new Set());
    const participantesAtuaisRef = useRef<Set<string>>(new Set());
    const sinaisPendentesRef = useRef<SinalWebRTC[]>([]);
    const temporizadorEntradaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const temporizadorAvisoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [nome, setNome] = useState('');
    const [salaId, setSalaId] = useState('');
    const [senha, setSenha] = useState('');
    const [cor, setCor] = useState(CORES_ESCOLHA[0]);
    const [chapeu, setChapeu] = useState<ChapeuEscolha>('nenhum');
    const [conectado, setConectado] = useState(false);
    const [entrando, setEntrando] = useState(false);
    const [servidor, setServidor] = useState<EstadoServidor>(estadoDoServidor);
    const [servidorAcordou, setServidorAcordou] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [atualizacao, setAtualizacao] = useState<AvisoVersao | null>(null);
    const [meuId, setMeuId] = useState<string | null>(null);

    const [sala, setSala] = useState<SalaResponse | null>(null);
    const [mensagens, setMensagens] = useState<MensagemResponse[]>([]);
    const [texto, setTexto] = useState('');
    const [compartilhando, setCompartilhando] = useState(false);

    const [streamsRemotas, setStreamsRemotas] = useState<Map<string, MediaStream>>(new Map());
    const [streamLocal, setStreamLocal] = useState<MediaStream | null>(null);
    const [previa, setPrevia] = useState<PreviaTransmissao | null>(null);
    const previaRef = useRef<PreviaTransmissao | null>(null);
    const [chatAberto, setChatAberto] = useState(true);
    const [diagnostico, setDiagnostico] = useState<DiagnosticoPeer[]>([]);
    const [tiposServidoresIce, setTiposServidoresIce] = useState<string[]>([]);

    const transmissaoAtiva = sala?.participantes.some((p) => p.compartilhando) ?? false;

    useEffect(() => {
        if (!conectado || !transmissaoAtiva) return;
        let ativo = true;

        const ler = async () => {
            const dados = await webrtcRef.current?.coletarDiagnostico();
            if (ativo && dados) setDiagnostico(dados);
        };

        ler();
        const intervalo = setInterval(ler, 2000);
        return () => {
            ativo = false;
            clearInterval(intervalo);
        };
    }, [conectado, transmissaoAtiva]);

    useEffect(() => {
        const parar = observarServidor((novo) => {
            setServidor(novo);
            if (novo === 'acordando') setServidorAcordou(true);
        });
        void garantirServidor();
        return parar;
    }, []);

    useEffect(() => {
        const daUrl = new URLSearchParams(window.location.search).get('sala');
        // eslint-disable-next-line react-hooks/set-state-in-effect -- le a URL e o localStorage so no cliente (evita hydration mismatch)
        if (daUrl) setSalaId(daUrl);

        try {
            const corSalva = window.localStorage.getItem(CHAVE_COR);
            setCor(corSalva && CORES_ESCOLHA.includes(corSalva) ? corSalva : corPadraoAleatoria());

            const chapeuSalvo = window.localStorage.getItem(CHAVE_CHAPEU) as ChapeuEscolha | null;
            if (chapeuSalvo && CHAPEUS_ESCOLHA.some((c) => c.valor === chapeuSalvo)) {
                setChapeu(chapeuSalvo);
            }
        } catch {}

        const desktop = window.contela;
        if (!desktop) return;
        desktop.salaInicial().then((id) => id && setSalaId(id));
        return desktop.aoReceberSala(setSalaId);
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(CHAVE_COR, cor);
        } catch {}
    }, [cor]);

    useEffect(() => {
        try {
            window.localStorage.setItem(CHAVE_CHAPEU, chapeu);
        } catch {}
    }, [chapeu]);

    useEffect(() => {
        return () => {
            if (temporizadorEntradaRef.current) clearTimeout(temporizadorEntradaRef.current);
            if (temporizadorAvisoRef.current) clearTimeout(temporizadorAvisoRef.current);
            const client = clientRef.current;
            clientRef.current = null;
            try {
                webrtcRef.current?.pararCompartilhamento();
            } catch {}
            client?.deactivate();
        };
    }, []);

    function mostrarErro(mensagem: string) {
        setErro(mensagem);
        if (temporizadorAvisoRef.current) clearTimeout(temporizadorAvisoRef.current);
        temporizadorAvisoRef.current = setTimeout(() => setErro(null), TEMPO_AVISO_MS);
    }

    function limparErro() {
        if (temporizadorAvisoRef.current) clearTimeout(temporizadorAvisoRef.current);
        setErro(null);
    }

    function encerrarSessao(mensagem?: string) {
        if (temporizadorEntradaRef.current) clearTimeout(temporizadorEntradaRef.current);

        const client = clientRef.current;
        clientRef.current = null;
        try {
            webrtcRef.current?.pararCompartilhamento();
        } catch {}
        webrtcRef.current = null;
        client?.deactivate();

        meuIdRef.current = null;
        salaIdAtualRef.current = null;
        entradoRef.current = false;
        sincronizadoRef.current = false;
        compartilhandoRef.current = false;
        participantesConhecidosRef.current = new Set();
        participantesAtuaisRef.current = new Set();
        sinaisPendentesRef.current = [];

        setConectado(false);
        setEntrando(false);
        setMeuId(null);
        setSala(null);
        setMensagens([]);
        setStreamLocal(null);
        previaRef.current = null;
        setPrevia(null);
        setStreamsRemotas(new Map());
        setCompartilhando(false);
        setAtualizacao(null);
        if (mensagem) mostrarErro(mensagem);
    }

    function processarSinal(sinal: SinalWebRTC) {
        if (!participantesAtuaisRef.current.has(sinal.remetenteId)) return;
        webrtcRef.current?.processarSinalRecebido(sinal);
    }

    async function iniciarConexao(salaAlvo: string, tokenDono: string | null) {
        if (clientRef.current) return;

        const client = criarClienteStomp();
        clientRef.current = client;
        limparErro();
        setEntrando(true);

        const servidoresIce = await buscarServidoresIce();
        if (clientRef.current !== client) return;

        client.onConnect = () => {
            entrarNaSala(client, salaAlvo, { nome, senha, tokenDono, cor, chapeu }, {
                onConfirmacao: ({ meuId: idRecebido, salaId: salaConfirmada }) => {
                    if (temporizadorEntradaRef.current) clearTimeout(temporizadorEntradaRef.current);
                    entradoRef.current = true;
                    meuIdRef.current = idRecebido;
                    salaIdAtualRef.current = salaConfirmada;
                    participantesConhecidosRef.current.add(idRecebido);
                    setSalaId(salaConfirmada);
                    setMeuId(idRecebido);

                    webrtcRef.current = new GerenciadorWebRTC(
                        client,
                        salaConfirmada,
                        idRecebido,
                        (peerId, stream) => {
                            setStreamsRemotas((prev) => new Map(prev).set(peerId, stream));
                        },
                        (peerId) => {
                            setStreamsRemotas((prev) => {
                                const novo = new Map(prev);
                                novo.delete(peerId);
                                return novo;
                            });
                        },
                        servidoresIce
                    );
                    setTiposServidoresIce(webrtcRef.current.tiposServidoresIce());

                    setConectado(true);
                    setEntrando(false);
                },
                onParticipantes: (salaAtualizada) => {
                    participantesAtuaisRef.current = new Set(salaAtualizada.participantes.map((p) => p.id));

                    const novosIds = salaAtualizada.participantes
                        .map((p) => p.id)
                        .filter((id) => id !== meuIdRef.current && !participantesConhecidosRef.current.has(id));

                    novosIds.forEach((id) => {
                        participantesConhecidosRef.current.add(id);
                        webrtcRef.current?.adicionarParticipante(id);
                    });

                    const euNaSala = salaAtualizada.participantes.find((p) => p.id === meuIdRef.current);
                    if (compartilhandoRef.current && euNaSala && !euNaSala.compartilhando) {
                        pararLocalmente();
                    }

                    setSala(salaAtualizada);

                    if (!sincronizadoRef.current) {
                        sincronizadoRef.current = true;
                        const pendentes = sinaisPendentesRef.current;
                        sinaisPendentesRef.current = [];
                        pendentes.forEach(processarSinal);
                    }
                },
                onMensagem: (novaMensagem) => setMensagens((prev) => [...prev, novaMensagem]),
                onSinal: (sinal) => {
                    if (!sincronizadoRef.current) {
                        sinaisPendentesRef.current.push(sinal);
                        return;
                    }
                    processarSinal(sinal);
                },
                onErro: (mensagem) => {
                    if (entradoRef.current) mostrarErro(mensagem);
                    else encerrarSessao(mensagem);
                },
                onAviso: setAtualizacao,
                onExpulso: (motivo) =>
                    encerrarSessao(
                        motivo === 'encerrada'
                            ? 'Esta sala foi encerrada pela administração do Contela.'
                            : 'Você foi removido da sala pelo anfitrião.'
                    ),
            });

            temporizadorEntradaRef.current = setTimeout(() => {
                if (!entradoRef.current) encerrarSessao('O servidor não respondeu. Tente novamente.');
            }, TEMPO_LIMITE_ENTRADA_MS);
        };

        client.onStompError = (frame) => {
            console.error('Erro STOMP:', frame);
        };

        client.onWebSocketClose = () => {
            if (clientRef.current !== client) return;
            encerrarSessao(
                entradoRef.current ? 'A conexão com o servidor foi perdida.' : 'Não foi possível conectar ao servidor.'
            );
        };

        client.activate();
    }

    async function servidorDisponivel(): Promise<boolean> {
        if (await garantirServidor()) return true;
        setEntrando(false);
        mostrarErro('Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.');
        return false;
    }

    async function handleEntrar() {
        const alvo = normalizarSalaId(salaId);
        if (!nome.trim() || !alvo || entrando || clientRef.current) return;

        limparErro();
        setEntrando(true);
        if (!(await servidorDisponivel())) return;
        iniciarConexao(alvo, null);
    }

    async function handleCriar() {
        if (!nome.trim() || entrando || clientRef.current) return;

        limparErro();
        setEntrando(true);
        if (!(await servidorDisponivel())) return;
        try {
            const criada = await criarSala(senha);
            setSalaId(criada.id);
            iniciarConexao(criada.id, criada.tokenDono);
        } catch (e) {
            setEntrando(false);
            mostrarErro(e instanceof Error ? e.message : 'Não foi possível criar a sala.');
        }
    }

    function handleSair() {
        encerrarSessao();
    }

    function handleEnviarMensagem() {
        if (!clientRef.current || !salaIdAtualRef.current || !texto.trim()) return;
        enviarMensagem(clientRef.current, salaIdAtualRef.current, texto);
        setTexto('');
    }

    function handleEnviarGif(url: string) {
        if (!clientRef.current || !salaIdAtualRef.current) return;
        enviarMensagem(clientRef.current, salaIdAtualRef.current, url, 'GIF');
    }

    async function handleCompartilhar(opcoes: OpcoesCompartilhamento, fonteId: string | null, nomeFonte: string | null = null) {
        if (!webrtcRef.current || !sala || !clientRef.current || !salaIdAtualRef.current) return;

        if (sala.participantes.some((p) => p.compartilhando && p.id !== meuId)) {
            mostrarErro('Outra pessoa já está compartilhando a tela.');
            return;
        }

        const gerenciador = webrtcRef.current;
        let stream: MediaStream;
        try {
            stream = await gerenciador.capturar(opcoes, fonteId);
        } catch (erro) {
            if (erro instanceof Error && erro.message === ERRO_SEM_AUDIO) {
                mostrarErro('Nenhum áudio foi compartilhado. Marque a opção de compartilhar o áudio no seletor do navegador.');
            }
            return;
        }

        const nova: PreviaTransmissao = { stream, opcoes, nomeFonte, semAudio: gerenciador.audioDeJanelaFalhou };
        stream.getVideoTracks().forEach((faixa) =>
            faixa.addEventListener('ended', () => {
                if (previaRef.current?.stream === stream) handleCancelarPrevia();
            }),
        );
        previaRef.current = nova;
        setPrevia(nova);
    }

    function handleCancelarPrevia() {
        previaRef.current = null;
        setPrevia(null);
        webrtcRef.current?.descartarCaptura();
    }

    async function handleConfirmarTransmissao() {
        const atual = previaRef.current;
        const gerenciador = webrtcRef.current;
        if (!atual || !gerenciador || !sala || !clientRef.current || !salaIdAtualRef.current) return;

        if (sala.participantes.some((p) => p.compartilhando && p.id !== meuId)) {
            handleCancelarPrevia();
            mostrarErro('Outra pessoa já está compartilhando a tela.');
            return;
        }

        const outrosIds = sala.participantes.map((p) => p.id).filter((id) => id !== meuId);
        try {
            await gerenciador.iniciarTransmissao(outrosIds);
        } catch {
            handleCancelarPrevia();
            mostrarErro('Não foi possível iniciar a transmissão.');
            return;
        }

        previaRef.current = null;
        setPrevia(null);
        setStreamLocal(atual.opcoes.apenasAudio ? new MediaStream(atual.stream.getAudioTracks()) : atual.stream);
        enviarStatusCompartilhamento(clientRef.current, salaIdAtualRef.current, true);
        compartilhandoRef.current = true;
        setCompartilhando(true);

        if (atual.semAudio) {
            mostrarErro('Não foi possível capturar o áudio dessa janela. Você está transmitindo sem som.');
        }
    }

    function pararLocalmente() {
        webrtcRef.current?.pararCompartilhamento();
        setStreamLocal(null);
        compartilhandoRef.current = false;
        setCompartilhando(false);
    }

    function handlePararCompartilhamento() {
        if (clientRef.current && salaIdAtualRef.current) {
            enviarStatusCompartilhamento(clientRef.current, salaIdAtualRef.current, false);
        }
        pararLocalmente();
    }

    function handlePararDe(alvoId: string) {
        if (clientRef.current && salaIdAtualRef.current) {
            pararCompartilhamentoDe(clientRef.current, salaIdAtualRef.current, alvoId);
        }
    }

    function handleExpulsar(alvoId: string) {
        if (clientRef.current && salaIdAtualRef.current) {
            expulsarParticipante(clientRef.current, salaIdAtualRef.current, alvoId);
        }
    }

    return {
        nome,
        setNome,
        salaId,
        setSalaId,
        senha,
        setSenha,
        cor,
        setCor,
        chapeu,
        setChapeu,
        conectado,
        entrando,
        servidor,
        servidorAcordou,
        erro,
        limparErro,
        atualizacao,
        dispensarAtualizacao: () => setAtualizacao(null),
        diagnostico: transmissaoAtiva ? diagnostico : [],
        tiposServidoresIce,
        meuId,
        souDono: sala !== null && sala.donoId === meuId,
        sala,
        mensagens,
        texto,
        setTexto,
        compartilhando,
        streamLocal,
        streamsRemotas,
        chatAberto,
        onToggleChat: () => setChatAberto((v) => !v),
        handleEntrar,
        handleCriar,
        handleSair,
        handleEnviarMensagem,
        handleEnviarGif,
        previa,
        handleCompartilhar,
        handleConfirmarTransmissao,
        handleCancelarPrevia,
        handlePararCompartilhamento,
        handlePararDe,
        handleExpulsar,
    };
}
