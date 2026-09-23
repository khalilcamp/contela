'use client';

import { useEffect, useState } from 'react';
import { buscarPessoasOnline } from '../lib/estatisticas';

const INTERVALO_MS = 20000;

export function PillPessoasOnline({ className }: { className?: string }) {
    const [pessoas, setPessoas] = useState<number | null>(null);

    useEffect(() => {
        let ativo = true;

        function buscar() {
            buscarPessoasOnline().then((n) => {
                if (ativo) setPessoas(n);
            });
        }

        buscar();
        const intervalo = setInterval(buscar, INTERVALO_MS);
        return () => {
            ativo = false;
            clearInterval(intervalo);
        };
    }, []);

    if (pessoas === null) return null;

    return (
        <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border border-signal/50 bg-signal/10 px-3 py-1 text-xs font-medium text-signal ${className ?? ''}`}
        >
            <span
                aria-hidden
                className="h-2 w-2 rounded-full bg-signal shadow-[0_0_8px_2px_rgba(94,234,212,0.65)] motion-safe:animate-pulse"
            />
            {pessoas} {pessoas === 1 ? 'pessoa' : 'pessoas'}
        </span>
    );
}
