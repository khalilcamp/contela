'use client';

import { useEffect, useRef, useState } from 'react';
import { Integrante } from '../types/sala';
import { AcaoTile, TileParticipante } from './TileParticipante';

interface GradeParticipantesProps {
    participantes: Integrante[];
    meuId: string | null;
    acoesPara?: (participante: Integrante) => AcaoTile[];
}

const GAP = 16;
const LADO_MINIMO = 100;
const LADO_MAXIMO = 340;

function calcularLayout(n: number, largura: number, altura: number) {
    if (n <= 0 || largura <= 0 || altura <= 0) {
        return { colunas: 1, lado: 0 };
    }

    let melhorColunas = 1;
    let melhorLado = 0;

    for (let colunas = 1; colunas <= n; colunas++) {
        const linhas = Math.ceil(n / colunas);
        const larguraDisponivel = largura - GAP * (colunas - 1);
        const alturaDisponivel = altura - GAP * (linhas - 1);
        const lado = Math.min(larguraDisponivel / colunas, alturaDisponivel / linhas);

        if (lado > melhorLado) {
            melhorLado = lado;
            melhorColunas = colunas;
        }
    }

    const lado = Math.min(Math.max(melhorLado, LADO_MINIMO), LADO_MAXIMO);
    return { colunas: melhorColunas, lado };
}

export function GradeParticipantes({ participantes, meuId, acoesPara }: GradeParticipantesProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState({ colunas: 1, lado: 0 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const recalcular = () => {
            const { width, height } = el.getBoundingClientRect();
            setLayout(calcularLayout(participantes.length, width, height));
        };

        recalcular();

        const observer = new ResizeObserver(recalcular);
        observer.observe(el);
        return () => observer.disconnect();
    }, [participantes.length]);

    return (
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-ink p-6">
            <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-y-auto">
                <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${layout.colunas}, ${layout.lado}px)`, gap: GAP }}
                >
                    {participantes.map((p) => (
                        <div key={p.id} style={{ width: layout.lado, height: layout.lado }}>
                            <TileParticipante
                                id={p.id}
                                nome={p.nome}
                                meuId={meuId}
                                acoes={acoesPara?.(p)}
                                tamanhoAvatar={Math.min(160, Math.max(44, layout.lado * 0.5))}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
