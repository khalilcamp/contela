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
import { GerenciadorWebRTC } from '../lib/webrtc';
import { SalaResponse, MensagemResponse, SinalWebRTC } from '../types/sala';
import { OpcoesCompartilhamento } from '../types/compartilhamento';

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
    const [conectado, setConectado] = useState(false);
    const [entrando, setEntrando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [atualizacao, setAtualizacao] = useState<AvisoVersao | null>(null);
    const [meuId, setMeuId] = useState<string | null>(null);

    const [sala, setSala] = useState<SalaResponse | null>(null);
    const [mensagens, setMensagens] = useState<MensagemResponse[]>([]);
    const [texto, setTexto] = useState('');
    const [compartilhando, setCompartilhando] = useState(false);

    const [streamsRemotas, setStreamsRemotas] = useState<Map<string, MediaStream>>(new Map());
    const [streamLocal, setStreamLocal] = useState<MediaStream | null>(null);
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
        const daUrl = new URLSearchParams(window.location.search).get('sala');
        // eslint-disable-next-line react-hooks/set-state-in-effect -- le a URL so no cliente (evita hydration mismatch)
        if (daUrl) setSalaId(daUrl);

        const desktop = window.contela;
        if (!desktop) return;
        desktop.salaInicial().then((id) => id && setSalaId(id));
        return desktop.aoReceberSala(setSalaId);
    }, []);

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
            entrarNaSala(client, salaAlvo, { nome, senha, tokenDono }, {
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

    function handleEntrar() {
        const alvo = normalizarSalaId(salaId);
        if (!nome.trim() || !alvo || entrando || clientRef.current) return;
        iniciarConexao(alvo, null);
    }

    async function handleCriar() {
        if (!nome.trim() || entrando || clientRef.current) return;

        limparErro();
        setEntrando(true);
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

    async function handleCompartilhar(opcoes: OpcoesCompartilhamento, fonteId: string | null) {
        if (!webrtcRef.current || !sala || !clientRef.current || !salaIdAtualRef.current) return;

        if (sala.participantes.some((p) => p.compartilhando && p.id !== meuId)) {
            mostrarErro('Outra pessoa já está compartilhando a tela.');
            return;
        }

        const outrosIds = sala.participantes
            .map((p) => p.id)
            .filter((id) => id !== meuId);

        const gerenciador = webrtcRef.current;
        let stream: MediaStream;
        try {
            stream = await gerenciador.iniciarCompartilhamento(outrosIds, opcoes, fonteId);
        } catch {
            return;
        }

        setStreamLocal(stream);
        enviarStatusCompartilhamento(clientRef.current, salaIdAtualRef.current, true);
        compartilhandoRef.current = true;
        setCompartilhando(true);

        if (gerenciador.audioDeJanelaFalhou) {
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
        conectado,
        entrando,
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
        handleCompartilhar,
        handlePararCompartilhamento,
        handlePararDe,
        handleExpulsar,
    };
}
