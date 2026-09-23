'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { buscarUltimaRelease, DownloadsRelease } from '../lib/downloads';

export function BaixarApp({ className = '' }: { className?: string }) {
    const [release, setRelease] = useState<DownloadsRelease | null>(null);

    useEffect(() => {
        let ativo = true;
        buscarUltimaRelease().then((r) => {
            if (ativo) setRelease(r);
        });
        return () => {
            ativo = false;
        };
    }, []);

    const carregando = release === null;
    const portatilUrl = release?.portatilUrl ?? null;

    return (
        <div className={`max-w-sm rounded-xl border border-line bg-ink-2/60 p-3.5 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                    <Image src="/icone-app.png" alt="" width={36} height={36} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-paper">Baixe o Contela pro desktop</p>
                    <p className="text-xs text-mute">Notificações nativas, menos eco e atualização automática.</p>
                </div>
            </div>

            <div className="mt-3 flex gap-2">
                {carregando ? (
                    <span className="flex-1 rounded-lg bg-ink-3 px-3 py-2 text-center text-xs font-medium text-mute">
                        Carregando...
                    </span>
                ) : portatilUrl ? (
                    <a
                        href={portatilUrl}
                        className="flex-1 rounded-lg bg-signal px-3 py-2 text-center text-xs font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                    >
                        Baixar portátil (.exe)
                    </a>
                ) : (
                    <a
                        href={release.paginaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-lg bg-ink-3 px-3 py-2 text-center text-xs font-medium text-paper transition hover:bg-ink-3/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                    >
                        Ver releases no GitHub
                    </a>
                )}

                <span
                    title="Aguardando a certificação da SignPath Foundation para assinar o instalador"
                    className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-mute"
                >
                    Instalador — em breve
                </span>
            </div>
        </div>
    );
}
