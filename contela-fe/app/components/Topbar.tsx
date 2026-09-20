import { Integrante } from '../types/sala';
import { Avatar } from './Avatar';
import { IconChat } from './icons';

interface TopbarProps {
    salaId: string;
    participantes: Integrante[];
    chatAberto: boolean;
    onToggleChat: () => void;
}

export function Topbar({ salaId, participantes, chatAberto, onToggleChat }: TopbarProps) {
    const emAndamento = participantes.some((p) => p.compartilhando);

    return (
        <div className="mx-3 mt-3 flex h-12 shrink-0 items-center gap-3 rounded-xl border border-line bg-ink-2/80 px-4 backdrop-blur-xl">
            <span className="font-display text-sm font-semibold tracking-tight text-paper">Contela</span>
            <span aria-hidden className="h-4 w-px bg-line" />
            <span className="text-sm font-medium text-paper">{salaId}</span>

            {emAndamento && (
                <span className="flex items-center gap-1.5 rounded-md bg-live/15 px-2 py-0.5 text-xs font-medium text-live">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" />
                    No ar
                </span>
            )}

            <div className="ml-auto flex items-center gap-3">
                <div className="flex -space-x-2">
                    {participantes.slice(0, 5).map((p) => (
                        <div key={p.id} title={p.nome}>
                            <Avatar id={p.id} nome={p.nome} tamanho={28} compartilhando={p.compartilhando} />
                        </div>
                    ))}
                </div>
                {participantes.length > 0 && <span className="text-xs text-mute">{participantes.length}</span>}

                <button
                    onClick={onToggleChat}
                    title="Chat"
                    aria-pressed={chatAberto}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                        chatAberto ? 'bg-signal text-signal-ink' : 'bg-ink-3 text-mute hover:text-paper'
                    }`}
                >
                    <IconChat className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
