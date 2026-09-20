import { IconFechar } from './icons';

interface AvisoProps {
    mensagem: string | null;
    onFechar: () => void;
}

export function Aviso({ mensagem, onFechar }: AvisoProps) {
    if (!mensagem) return null;

    return (
        <div
            role="alert"
            className="fixed left-1/2 top-[72px] z-30 flex max-w-[min(92vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-live/40 bg-ink-2 px-4 py-2.5 text-sm text-paper shadow-xl shadow-black/50"
        >
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-live" />
            <span className="min-w-0">{mensagem}</span>
            <button
                onClick={onFechar}
                aria-label="Fechar aviso"
                className="shrink-0 rounded-md p-1 text-mute transition hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
            >
                <IconFechar className="h-4 w-4" />
            </button>
        </div>
    );
}
