import { MensagemResponse } from '../types/sala';
import { Avatar } from './Avatar';
import { IconSend, IconSino, IconSinoOff } from './icons';

interface ChatPanelProps {
    mensagens: MensagemResponse[];
    texto: string;
    onTextoChange: (valor: string) => void;
    onEnviar: () => void;
    meuId: string | null;
    notificacoes: boolean;
    onAlternarNotificacoes: () => void;
}

function formatarHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({
    mensagens,
    texto,
    onTextoChange,
    onEnviar,
    meuId,
    notificacoes,
    onAlternarNotificacoes,
}: ChatPanelProps) {
    return (
        <div className="my-3 mr-3 flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-ink-2/80 backdrop-blur-xl">
            <div className="flex h-12 items-center justify-between border-b border-line pl-4 pr-2 font-display font-semibold text-paper">
                Chat
                <button
                    onClick={onAlternarNotificacoes}
                    aria-pressed={notificacoes}
                    aria-label="Notificações de mensagens"
                    title={notificacoes ? 'Notificações ligadas' : 'Notificações desligadas'}
                    className={`rounded-md p-1.5 transition hover:bg-ink-3 focus-visible:outline-2 focus-visible:outline-signal ${
                        notificacoes ? 'text-signal' : 'text-mute'
                    }`}
                >
                    {notificacoes ? <IconSino className="h-4 w-4" /> : <IconSinoOff className="h-4 w-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
                {mensagens.length === 0 && <p className="text-sm text-mute">Nenhuma mensagem ainda.</p>}

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
                                            className={`truncate text-sm font-semibold ${
                                                m.integranteId === meuId ? 'text-signal' : 'text-paper'
                                            }`}
                                        >
                                            {m.nomeIntegrante}
                                        </span>
                                        <span className="shrink-0 text-[11px] text-mute">{formatarHora(m.enviadaEm)}</span>
                                    </div>
                                )}
                                <p className="break-words text-sm text-paper/75">{m.texto}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-line p-3">
                <div className="flex items-center gap-2 rounded-lg border border-line bg-ink py-1.5 pl-3 pr-1.5 focus-within:border-signal">
                    <input
                        value={texto}
                        onChange={(e) => onTextoChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onEnviar()}
                        placeholder="Enviar mensagem"
                        className="min-w-0 flex-1 bg-transparent py-1 text-sm text-paper outline-none placeholder:text-mute"
                    />
                    <button
                        onClick={onEnviar}
                        disabled={!texto.trim()}
                        aria-label="Enviar"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-signal text-signal-ink transition hover:brightness-110 disabled:opacity-30"
                    >
                        <IconSend className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
