import { IconMonitor, IconMonitorOff } from './icons';

interface ControlBarProps {
    compartilhando: boolean;
    onCompartilhar: () => void;
    onPararCompartilhamento: () => void;
}

export function ControlBar({ compartilhando, onCompartilhar, onPararCompartilhamento }: ControlBarProps) {
    return (
        <div className="flex items-center rounded-full border border-white/10 bg-discord-bg-secondary/90 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-md">
            {!compartilhando ? (
                <button
                    onClick={onCompartilhar}
                    className="flex items-center gap-2 rounded-full bg-discord-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-discord-brand-hover"
                >
                    <IconMonitor className="h-4 w-4" />
                    Compartilhar tela
                </button>
            ) : (
                <button
                    onClick={onPararCompartilhamento}
                    className="flex items-center gap-2 rounded-full bg-discord-red px-5 py-2.5 text-sm font-medium text-white transition hover:bg-discord-red-hover"
                >
                    <IconMonitorOff className="h-4 w-4" />
                    Parar compartilhamento
                </button>
            )}
        </div>
    );
}
