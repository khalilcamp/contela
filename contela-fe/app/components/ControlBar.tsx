import { IconMonitor, IconMonitorOff } from './icons';

interface ControlBarProps {
    compartilhando: boolean;
    bloqueado: boolean;
    onCompartilhar: () => void;
    onPararCompartilhamento: () => void;
}

export function ControlBar({ compartilhando, bloqueado, onCompartilhar, onPararCompartilhamento }: ControlBarProps) {
    return (
        <div className="flex items-center gap-1 rounded-2xl border border-line bg-ink-2/90 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-md">
            {!compartilhando ? (
                <button
                    onClick={onCompartilhar}
                    disabled={bloqueado}
                    title={bloqueado ? 'Outra pessoa está compartilhando agora' : undefined}
                    className="flex items-center gap-2 rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
                >
                    <IconMonitor className="h-4 w-4" />
                    {bloqueado ? 'Outra pessoa está compartilhando' : 'Compartilhar tela'}
                </button>
            ) : (
                <>
                    <span className="flex items-center gap-2 px-4 text-sm text-paper">
                        <span aria-hidden className="h-2 w-2 rounded-full bg-live motion-safe:animate-pulse" />
                        No ar
                    </span>
                    <button
                        onClick={onPararCompartilhamento}
                        className="flex items-center gap-2 rounded-xl bg-ink-3 px-4 py-2.5 text-sm font-medium text-live transition hover:bg-live hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-live"
                    >
                        <IconMonitorOff className="h-4 w-4" />
                        Parar
                    </button>
                </>
            )}
        </div>
    );
}
