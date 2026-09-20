import { useState } from 'react';
import { SalaResponse, MensagemResponse } from '../types/sala';
import { OpcoesCompartilhamento } from '../types/compartilhamento';
import { DrawerCompartilhamento } from '../components/DrawerCompartilhamento';
import { Topbar } from '../components/Topbar';
import { VideoStage } from '../components/VideoStage';
import { ChatPanel } from '../components/ChatPanel';
import { ControlBar } from '../components/ControlBar';

interface CompartilhamentoTelaProps {
    salaId: string;
    sala: SalaResponse | null;
    meuId: string | null;
    compartilhando: boolean;
    streamLocal: MediaStream | null;
    streamsRemotas: Map<string, MediaStream>;
    mensagens: MensagemResponse[];
    texto: string;
    onTextoChange: (valor: string) => void;
    onEnviarMensagem: () => void;
    onCompartilhar: (opcoes: OpcoesCompartilhamento, fonteId: string | null) => void;
    onPararCompartilhamento: () => void;
    chatAberto: boolean;
    onToggleChat: () => void;
}

export default function CompartilhamentoTela({
    salaId,
    sala,
    meuId,
    compartilhando,
    streamLocal,
    streamsRemotas,
    mensagens,
    texto,
    onTextoChange,
    onEnviarMensagem,
    onCompartilhar,
    onPararCompartilhamento,
    chatAberto,
    onToggleChat,
}: CompartilhamentoTelaProps) {
    const [drawerAberto, setDrawerAberto] = useState(false);

    return (
        <div className="flex h-screen flex-col bg-ink text-paper">
            <Topbar
                salaId={salaId}
                participantes={sala?.participantes ?? []}
                chatAberto={chatAberto}
                onToggleChat={onToggleChat}
            />

            <div className="flex flex-1 overflow-hidden">
                <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                    <VideoStage
                        streamLocal={streamLocal}
                        meuId={meuId}
                        participantes={sala?.participantes ?? []}
                        streamsRemotas={streamsRemotas}
                    />

                    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                        <div className="pointer-events-auto">
                            <ControlBar
                                compartilhando={compartilhando}
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
