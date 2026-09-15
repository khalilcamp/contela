import { SalaResponse, MensagemResponse } from '../types/sala';
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
    onCompartilhar: () => void;
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
    return (
        <div className="flex h-screen flex-col bg-black text-discord-text">
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
                                onCompartilhar={onCompartilhar}
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
        </div>
    );
}
