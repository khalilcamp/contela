'use client';

import { useEffect, useRef, useState } from 'react';
import { AcaoAtalho, acaoDaTecla } from '../lib/atalhos';

const CHAVE_GLOBAIS = 'contela:atalhos-globais';

function lerPreferenciaGlobais(): boolean {
    try {
        return window.localStorage.getItem(CHAVE_GLOBAIS) !== '0';
    } catch {
        return true;
    }
}

export type AcaoDoApp = AcaoAtalho | 'chat-abrir';

export function useAtalhos(aoAcionar: (acao: AcaoDoApp) => void) {
    const acionarRef = useRef(aoAcionar);
    const [globais, setGlobais] = useState(lerPreferenciaGlobais);
    const [falhas, setFalhas] = useState<string[]>([]);

    useEffect(() => {
        acionarRef.current = aoAcionar;
    });

    useEffect(() => {
        const aoTeclar = (evento: KeyboardEvent) => {
            const acao = acaoDaTecla(evento);
            if (!acao) return;
            evento.preventDefault();
            acionarRef.current(acao);
        };
        window.addEventListener('keydown', aoTeclar);
        const parar = window.contela?.aoAtalho?.((acao) => acionarRef.current(acao));
        return () => {
            window.removeEventListener('keydown', aoTeclar);
            parar?.();
        };
    }, []);

    useEffect(() => {
        const ponte = window.contela;
        if (!ponte?.ativarAtalhos) return;
        let vivo = true;
        ponte
            .ativarAtalhos(globais)
            .then((resultado) => vivo && setFalhas(resultado.falhas))
            .catch(() => {});
        return () => {
            vivo = false;
            ponte.ativarAtalhos(false).catch(() => {});
        };
    }, [globais]);

    function alterarGlobais(ativo: boolean) {
        setGlobais(ativo);
        try {
            window.localStorage.setItem(CHAVE_GLOBAIS, ativo ? '1' : '0');
        } catch {}
    }

    return { globais, alterarGlobais, falhas };
}
