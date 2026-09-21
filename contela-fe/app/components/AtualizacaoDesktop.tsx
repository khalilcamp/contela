'use client';

import { useEffect, useState } from 'react';
import type { StatusAtualizacao } from '../types/electron';
import { JanelaAtualizacao } from './JanelaAtualizacao';

export function AtualizacaoDesktop() {
    const [status, setStatus] = useState<StatusAtualizacao>({ estado: 'nenhum' });
    const [dispensado, setDispensado] = useState(false);

    useEffect(() => {
        const ponte = window.contela;
        if (!ponte?.aoMudarAtualizacao) return;
        ponte.atualizacaoStatus().then(setStatus).catch(() => {});
        return ponte.aoMudarAtualizacao((novo) => {
            setStatus((anterior) => {
                if (anterior.estado !== novo.estado) setDispensado(false);
                return novo;
            });
        });
    }, []);

    if (dispensado) return null;

    return (
        <JanelaAtualizacao
            status={status}
            onReiniciar={() => window.contela?.reiniciarParaAtualizar()}
            onFechar={() => setDispensado(true)}
        />
    );
}
