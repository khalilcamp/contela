'use client';

import { useState } from 'react';
import { JanelaAtualizacao } from '../../components/JanelaAtualizacao';
import type { StatusAtualizacao } from '../../types/electron';

const TOTAL = 112363569;

const CASOS: Record<string, StatusAtualizacao> = {
    Iniciando: { estado: 'baixando', versao: '0.1.4' },
    'Baixando 15%': {
        estado: 'baixando',
        versao: '0.1.4',
        progresso: { percentual: 15, bytesPorSegundo: 3400000, transferido: TOTAL * 0.15, total: TOTAL },
    },
    'Baixando 72%': {
        estado: 'baixando',
        versao: '0.1.4',
        progresso: { percentual: 72, bytesPorSegundo: 5200000, transferido: TOTAL * 0.72, total: TOTAL },
    },
    Pronta: { estado: 'pronta', versao: '0.1.4' },
    Erro: { estado: 'erro', versao: '0.1.4' },
};

export default function PreviaAtualizacao() {
    const [nome, setNome] = useState('Baixando 72%');
    const [visivel, setVisivel] = useState(true);

    if (process.env.NODE_ENV === 'production') return null;

    return (
        <main className="flex flex-1 flex-col gap-4 p-8 text-paper">
            <h1 className="text-lg font-semibold">Prévia da janela de atualização (só em desenvolvimento)</h1>
            <div className="flex flex-wrap gap-2">
                {Object.keys(CASOS).map((n) => (
                    <button
                        key={n}
                        onClick={() => {
                            setNome(n);
                            setVisivel(true);
                        }}
                        className={`rounded-md border px-3 py-1 text-sm ${n === nome ? 'border-signal text-signal' : 'border-line text-mute'}`}
                    >
                        {n}
                    </button>
                ))}
            </div>
            {visivel && (
                <JanelaAtualizacao
                    status={CASOS[nome]}
                    onReiniciar={() => setVisivel(false)}
                    onFechar={() => setVisivel(false)}
                />
            )}
        </main>
    );
}
