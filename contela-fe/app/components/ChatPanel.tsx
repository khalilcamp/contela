import { MensagemResponse } from '../types/sala';
import { Avatar } from './Avatar';
import { IconSend } from './icons';

interface ChatPanelProps {
    mensagens: MensagemResponse[];
    texto: string;
    onTextoChange: (valor: string) => void;
    onEnviar: () => void;
    meuId: string | null;
}

function formatarHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({ mensagens, texto, onTextoChange, onEnviar, meuId }: ChatPanelProps) {
    return (
        <div className="my-3 mr-3 flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-xl shadow-black/40 backdrop-blur-xl">
            <div className="flex h-12 items-center border-b border-white/10 px-4 font-semibold text-discord-text">
                Chat
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
                {mensagens.length === 0 && (
                    <p className="text-sm text-discord-text-muted">Nenhuma mensagem ainda.</p>
                )}

                {mensagens.map((m, i) => {
                    const anterior = mensagens[i - 1];
                    const mesmoAutor = anterior?.integranteId === m.integranteId;

                    return (
                        <div key={m.id} className={`flex gap-2.5 ${mesmoAutor ? 'mt-0.5' : 'mt-3'}`}>
                            <div className="w-7 shrink-0">
                                {!mesmoAutor && <Avatar id={m.integranteId} nome={m.nomeIntegrante} tamanho={28} />}
                            </div>

                            <div className="min-w-0 flex-1">
                                {!mesmoAutor && (
                                    <div className="flex items-baseline gap-2">
                                        <span
                                            className="truncate text-sm font-semibold"
                                            style={{ color: m.integranteId === meuId ? '#5865f2' : '#f2f3f5' }}
                                        >
                                            {m.nomeIntegrante}
                                        </span>
                                        <span className="shrink-0 text-[11px] text-discord-text-muted">
                                            {formatarHora(m.enviadaEm)}
                                        </span>
                                    </div>
                                )}
                                <p className="break-words text-sm text-discord-text-muted">{m.texto}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-white/10 p-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 py-1.5 pl-4 pr-1.5">
                    <input
                        value={texto}
                        onChange={(e) => onTextoChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onEnviar()}
                        placeholder="Enviar mensagem..."
                        className="min-w-0 flex-1 bg-transparent py-1 text-sm text-discord-text outline-none placeholder:text-discord-text-muted"
                    />
                    <button
                        onClick={onEnviar}
                        disabled={!texto.trim()}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-discord-brand text-white transition hover:bg-discord-brand-hover disabled:opacity-40"
                    >
                        <IconSend className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
