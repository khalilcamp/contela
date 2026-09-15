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
        <div className="mx-3 mt-3 flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 shadow-lg shadow-black/30 backdrop-blur-xl">
            <span className="font-display text-sm font-semibold tracking-tight text-discord-text">Contela</span>
            <span className="text-discord-text-muted">/</span>
            <span className="font-medium text-discord-text">{salaId}</span>

            {emAndamento && (
                <span className="flex items-center gap-1.5 rounded-full bg-discord-green/15 px-2 py-0.5 text-xs font-medium text-discord-green">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-discord-green opacity-75 motion-reduce:animate-none" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-discord-green" />
                    </span>
                    Ao vivo
                </span>
            )}

            <div className="ml-auto flex items-center gap-3">
                <div className="flex -space-x-2">
                    {participantes.slice(0, 5).map((p) => (
                        <div key={p.id} className="rounded-full ring-2 ring-black/40">
                            <Avatar id={p.id} nome={p.nome} tamanho={24} />
                        </div>
                    ))}
                </div>
                {participantes.length > 0 && (
                    <span className="text-xs text-discord-text-muted">{participantes.length}</span>
                )}

                <button
                    onClick={onToggleChat}
                    title="Chat"
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                        chatAberto
                            ? 'bg-discord-brand text-white'
                            : 'bg-white/10 text-discord-text-muted hover:bg-white/15 hover:text-discord-text'
                    }`}
                >
                    <IconChat className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
