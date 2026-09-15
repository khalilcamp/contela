'use client';

import { useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { criarClienteStomp, entrarNaSala, enviarMensagem, enviarStatusCompartilhamento } from '../lib/websocket';
import { GerenciadorWebRTC } from '../lib/webrtc';
import { SalaResponse, MensagemResponse } from '../types/sala';

export function useSalaConexao() {
    const clientRef = useRef<Client | null>(null);
    const webrtcRef = useRef<GerenciadorWebRTC | null>(null);
    const meuIdRef = useRef<string | null>(null);
    const compartilhandoRef = useRef(false);
    const participantesConhecidosRef = useRef<Set<string>>(new Set());

    const [nome, setNome] = useState('');
    const [salaId, setSalaId] = useState('');
    const [conectado, setConectado] = useState(false);
    const [meuId, setMeuId] = useState<string | null>(null);

    const [sala, setSala] = useState<SalaResponse | null>(null);
    const [mensagens, setMensagens] = useState<MensagemResponse[]>([]);
    const [texto, setTexto] = useState('');
    const [compartilhando, setCompartilhando] = useState(false);

    const [streamsRemotas, setStreamsRemotas] = useState<Map<string, MediaStream>>(new Map());
    const [streamLocal, setStreamLocal] = useState<MediaStream | null>(null);
    const [chatAberto, setChatAberto] = useState(true);

    function handleEntrar() {
        if (!nome || !salaId) return;

        const client = criarClienteStomp();

        client.onConnect = () => {
            setConectado(true);

            entrarNaSala(
                client,
                salaId,
                nome,
                (salaAtualizada) => {
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
                },
                (novaMensagem) => setMensagens((prev) => [...prev, novaMensagem]),
                (sinal) => webrtcRef.current?.processarSinalRecebido(sinal),
                (idRecebido) => {
                    meuIdRef.current = idRecebido;
                    participantesConhecidosRef.current.add(idRecebido);
                    setMeuId(idRecebido);

                    webrtcRef.current = new GerenciadorWebRTC(
                        client,
                        salaId,
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
                        }
                    );
                }
            );
        };

        client.onStompError = (frame) => {
            console.error('Erro STOMP:', frame);
        };

        client.activate();
        clientRef.current = client;
    }

    function handleEnviarMensagem() {
        if (!clientRef.current || !texto.trim()) return;
        enviarMensagem(clientRef.current, salaId, texto);
        setTexto('');
    }

    async function handleCompartilhar() {
        if (!webrtcRef.current || !sala || !clientRef.current) return;

        const outrosIds = sala.participantes
            .map((p) => p.id)
            .filter((id) => id !== meuId);

        let stream: MediaStream;
        try {
            stream = await webrtcRef.current.iniciarCompartilhamento(outrosIds);
        } catch {
            return;
        }

        setStreamLocal(stream);
        enviarStatusCompartilhamento(clientRef.current, salaId, true);
        compartilhandoRef.current = true;
        setCompartilhando(true);
    }

    function pararLocalmente() {
        webrtcRef.current?.pararCompartilhamento();
        setStreamLocal(null);
        compartilhandoRef.current = false;
        setCompartilhando(false);
    }

    function handlePararCompartilhamento() {
        if (clientRef.current) {
            enviarStatusCompartilhamento(clientRef.current, salaId, false);
        }
        pararLocalmente();
    }

    return {
        nome,
        setNome,
        salaId,
        setSalaId,
        conectado,
        meuId,
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
        handleEnviarMensagem,
        handleCompartilhar,
        handlePararCompartilhamento,
    };
}
