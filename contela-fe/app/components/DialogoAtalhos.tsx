'use client';

import { useEffect, useState } from 'react';
import { ATALHOS } from '../lib/atalhos';
import { IconFechar } from './icons';

interface DialogoAtalhosProps {
    aberto: boolean;
    onFechar: () => void;
    globais: boolean;
    onAlterarGlobais: (ativo: boolean) => void;
    falhas: string[];
}

export function DialogoAtalhos({ aberto, onFechar, globais, onAlterarGlobais, falhas }: DialogoAtalhosProps) {
    const [desktop] = useState(() => typeof window !== 'undefined' && window.contela?.ativarAtalhos !== undefined);

    useEffect(() => {
        if (!aberto) return;
        const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
        window.addEventListener('keydown', aoTeclar);
        return () => window.removeEventListener('keydown', aoTeclar);
    }, [aberto, onFechar]);

    if (!aberto) return null;

    return (
        <div onClick={onFechar} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-atalhos"
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-ink-2 p-6 shadow-2xl"
            >
                <header className="flex items-start justify-between gap-4">
                    <h2 id="titulo-atalhos" className="font-display text-xl font-semibold tracking-tight text-paper">
                        Atalhos de teclado
                    </h2>
                    <button
                        onClick={onFechar}
                        aria-label="Fechar"
                        className="rounded-md p-1.5 text-mute transition hover:bg-ink-3 hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <IconFechar className="h-5 w-5" />
                    </button>
                </header>

                <ul className="divide-y divide-line">
                    {ATALHOS.map((atalho) => (
                        <li key={atalho.acao} className="flex items-center justify-between gap-4 py-2.5">
                            <span className="text-sm text-paper">{atalho.descricao}</span>
                            <span className="flex shrink-0 flex-col items-end gap-1">
                                {atalho.tecla && <Tecla>{atalho.tecla}</Tecla>}
                                {atalho.global && (
                                    <span className={desktop && globais ? '' : 'opacity-60'}>
                                        <Tecla>{atalho.global}</Tecla>
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>

                <p className="text-xs text-mute">
                    As teclas simples funcionam com o Contela em foco e fora dos campos de texto.
                    {desktop
                        ? ' As combinações com Ctrl + Alt + Shift funcionam mesmo com o app em segundo plano, por exemplo dentro de um jogo.'
                        : ' As combinações com Ctrl + Alt + Shift também funcionam com o Contela em foco.'}
                </p>

                {desktop && (
                    <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-line pt-4">
                        <span>
                            <span className="block text-sm text-paper">Atalhos com o app em segundo plano</span>
                            <span className="block text-xs text-mute">Só ficam ativos enquanto você está em uma sala.</span>
                        </span>
                        <input
                            type="checkbox"
                            role="switch"
                            checked={globais}
                            onChange={(e) => onAlterarGlobais(e.target.checked)}
                            className="peer sr-only"
                        />
                        <span className="relative h-5 w-9 shrink-0 rounded-full border border-line bg-ink-3 transition peer-checked:border-signal peer-checked:bg-signal peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal after:absolute after:left-0.5 after:top-0.5 after:h-3.5 after:w-3.5 after:rounded-full after:bg-mute after:transition peer-checked:after:translate-x-4 peer-checked:after:bg-signal-ink motion-reduce:transition-none motion-reduce:after:transition-none" />
                    </label>
                )}

                {desktop && globais && falhas.length > 0 && (
                    <p role="alert" className="text-xs text-live">
                        Outro programa já usa {falhas.join(', ')}. Esse atalho só funciona com o Contela em foco.
                    </p>
                )}
            </div>
        </div>
    );
}

function Tecla({ children }: { children: string }) {
    return (
        <kbd className="rounded-md border border-line bg-ink-3 px-2 py-0.5 font-mono text-xs text-paper">{children}</kbd>
    );
}
