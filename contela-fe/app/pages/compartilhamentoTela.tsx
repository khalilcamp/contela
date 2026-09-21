import { useState } from 'react';
import { Integrante, SalaResponse, MensagemResponse } from '../types/sala';
import { OpcoesCompartilhamento } from '../types/compartilhamento';
import { Aviso } from '../components/Aviso';
import { AvisoAtualizacao } from '../components/AvisoAtualizacao';
import { AvisoVersao } from '../lib/websocket';
import { DrawerCompartilhamento } from '../components/DrawerCompartilhamento';
import { Topbar } from '../components/Topbar';
import { VideoStage } from '../components/VideoStage';
import { ChatPanel } from '../components/ChatPanel';
import { ControlBar } from '../components/ControlBar';

interface CompartilhamentoTelaProps {
    salaId: string;
    senhaSala: string;
    sala: SalaResponse | null;
    meuId: string | null;
    souDono: boolean;
    aviso: string | null;
    onFecharAviso: () => void;
    atualizacao: AvisoVersao | null;
    onDispensarAtualizacao: () => void;
    compartilhando: boolean;
    streamLocal: MediaStream | null;
    streamsRemotas: Map<string, MediaStream>;
    mensagens: MensagemResponse[];
    texto: string;
    onTextoChange: (valor: string) => void;
    onEnviarMensagem: () => void;
    onCompartilhar: (opcoes: OpcoesCompartilhamento, fonteId: string | null) => void;
    onPararCompartilhamento: () => void;
    onPararDe: (alvoId: string) => void;
    onExpulsar: (alvoId: string) => void;
    onSair: () => void;
    chatAberto: boolean;
    onToggleChat: () => void;
}

export default function CompartilhamentoTela({
    salaId,
    senhaSala,
    sala,
    meuId,
    souDono,
    aviso,
    onFecharAviso,
    atualizacao,
    onDispensarAtualizacao,
    compartilhando,
    streamLocal,
    streamsRemotas,
    mensagens,
    texto,
    onTextoChange,
    onEnviarMensagem,
    onCompartilhar,
    onPararCompartilhamento,
    onPararDe,
    onExpulsar,
    onSair,
    chatAberto,
    onToggleChat,
}: CompartilhamentoTelaProps) {
    const [drawerAberto, setDrawerAberto] = useState(false);
    const participantes = sala?.participantes ?? [];
    const outroCompartilhando = participantes.some((p) => p.compartilhando && p.id !== meuId);

    const acoesPara = souDono
        ? (p: Integrante) =>
              p.id === meuId
                  ? []
                  : [
                        ...(p.compartilhando ? [{ rotulo: 'Encerrar', onClick: () => onPararDe(p.id) }] : []),
                        { rotulo: 'Remover', perigo: true, onClick: () => onExpulsar(p.id) },
                    ]
        : undefined;

    return (
        <div className="flex h-screen flex-col bg-ink text-paper">
            <Topbar
                salaId={salaId}
                senhaSala={senhaSala}
                participantes={participantes}
                souDono={souDono}
                chatAberto={chatAberto}
                onToggleChat={onToggleChat}
                onSair={onSair}
            />

            <AvisoAtualizacao aviso={atualizacao} onDispensar={onDispensarAtualizacao} />

            <Aviso mensagem={aviso} onFechar={onFecharAviso} />

            <div className="flex flex-1 overflow-hidden">
                <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                    <VideoStage
                        streamLocal={streamLocal}
                        meuId={meuId}
                        participantes={participantes}
                        streamsRemotas={streamsRemotas}
                        acoesPara={acoesPara}
                    />

                    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                        <div className="pointer-events-auto">
                            <ControlBar
                                compartilhando={compartilhando}
                                bloqueado={outroCompartilhando}
                                onCompartilhar={() => setDrawerAberto(true)}
                                onPararCompartilhamento={onPararCompartilhamento}
                            />
                        </div>
                    </div>
                </div>

                {chatAberto && (
                    <ChatPanel
                        mensagens={mensagens}
                        texto={texto}
                        onTextoChange={onTextoChange}
                        onEnviar={onEnviarMensagem}
                        meuId={meuId}
                    />
                )}
            </div>

            <DrawerCompartilhamento
                aberto={drawerAberto}
                onFechar={() => setDrawerAberto(false)}
                onIniciar={(opcoes, fonteId) => {
                    setDrawerAberto(false);
                    onCompartilhar(opcoes, fonteId);
                }}
            />
        </div>
    );
}
