import type { StatusAtualizacao } from '../types/electron';
import { VERSAO_APP } from '../lib/versao';
import { Mascote } from './Mascote';

interface JanelaAtualizacaoProps {
    status: StatusAtualizacao;
    onReiniciar: () => void;
    onFechar: () => void;
}

function formatarMB(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function JanelaAtualizacao({ status, onReiniciar, onFechar }: JanelaAtualizacaoProps) {
    if (status.estado === 'nenhum') return null;

    const { estado, progresso } = status;
    const percentual = Math.round(progresso?.percentual ?? 0);
    const titulo =
        estado === 'baixando'
            ? 'Baixando atualização'
            : estado === 'pronta'
              ? 'Atualização pronta'
              : 'Não deu para atualizar';

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 z-50 w-80 overflow-hidden rounded-xl border border-line bg-ink-2 shadow-2xl"
        >
            <div className="flex items-start gap-3 p-4">
                <Mascote
                    acento={estado === 'erro' ? '#ff5c5c' : '#5eead4'}
                    estagioVisual={estado === 'erro' ? 0 : 1}
                    comemorando={estado === 'pronta'}
                    flutuar={estado !== 'erro'}
                    className="h-12 w-12 shrink-0"
                />
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-paper">{titulo}</p>
                    <p className="text-xs text-mute">
                        {estado === 'erro'
                            ? 'Tentamos de novo mais tarde. Você pode continuar usando o Contela.'
                            : `${VERSAO_APP} → ${status.versao ?? '...'}`}
                    </p>
                </div>
                {estado !== 'baixando' && (
                    <button
                        onClick={onFechar}
                        aria-label="Fechar"
                        className="rounded-md px-1.5 text-mute transition hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        ×
                    </button>
                )}
            </div>

            {estado === 'baixando' && (
                <div className="px-4 pb-4">
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progresso ? percentual : undefined}
                        className="h-1.5 overflow-hidden rounded-full bg-ink-3"
                    >
                        <div
                            className={`h-full rounded-full bg-signal transition-[width] duration-300 ${progresso ? '' : 'w-1/3 animate-pulse'}`}
                            style={progresso ? { width: `${percentual}%` } : undefined}
                        />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-mute">
                        <span>{progresso ? `${percentual}%` : 'Iniciando...'}</span>
                        {progresso && (
                            <span>
                                {formatarMB(progresso.transferido)} de {formatarMB(progresso.total)} ·{' '}
                                {formatarMB(progresso.bytesPorSegundo)}/s
                            </span>
                        )}
                    </div>
                </div>
            )}

            {estado === 'pronta' && (
                <div className="flex items-center gap-2 border-t border-line px-4 py-3">
                    <p className="min-w-0 flex-1 text-xs text-mute">Também instala sozinha ao fechar o app.</p>
                    <button
                        onClick={onFechar}
                        className="rounded-md px-2 py-1 text-xs text-mute transition hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        Depois
                    </button>
                    <button
                        onClick={onReiniciar}
                        className="rounded-md bg-signal px-3 py-1 text-xs font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                    >
                        Reiniciar agora
                    </button>
                </div>
            )}
        </div>
    );
}
