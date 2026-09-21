import { AvisoVersao } from '../lib/websocket';
import { VERSAO_APP } from '../lib/versao';

interface AvisoAtualizacaoProps {
    aviso: AvisoVersao | null;
    onDispensar: () => void;
}

export function AvisoAtualizacao({ aviso, onDispensar }: AvisoAtualizacaoProps) {
    if (!aviso) return null;

    return (
        <div
            role="status"
            className="mx-3 mt-2 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-signal/40 bg-signal/10 px-4 py-2 text-sm text-paper"
        >
            <span className="min-w-0 flex-1">
                Nova versão do Contela disponível: <span className="font-semibold">{aviso.versao}</span>. Você está na{' '}
                {VERSAO_APP}.
            </span>
            <a
                href={aviso.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-signal px-3 py-1 text-xs font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
                Baixar
            </a>
            <button
                onClick={onDispensar}
                className="rounded-md px-2 py-1 text-xs text-mute transition hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
            >
                Agora não
            </button>
        </div>
    );
}
