'use client';

import { useEffect, useRef, useState } from 'react';
import type { Integrante } from '../types/sala';

const CHAVE_SONS = 'contela:sons';

function lerPreferencia(): boolean {
    try {
        return window.localStorage.getItem(CHAVE_SONS) !== '0';
    } catch {
        return true;
    }
}

function tocarTom(contexto: AudioContext, frequencias: number[], duracao: number) {
    const agora = contexto.currentTime;
    const ganho = contexto.createGain();
    ganho.gain.setValueAtTime(0, agora);
    ganho.gain.linearRampToValueAtTime(0.15, agora + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);
    ganho.connect(contexto.destination);

    const passo = duracao / frequencias.length;
    frequencias.forEach((frequencia, i) => {
        const oscilador = contexto.createOscillator();
        oscilador.type = 'sine';
        oscilador.frequency.value = frequencia;
        oscilador.connect(ganho);
        const inicio = agora + i * passo;
        oscilador.start(inicio);
        oscilador.stop(inicio + passo + 0.02);
    });
}

interface Parametros {
    participantes: Integrante[];
    meuId: string | null;
}

export function useSonsSala({ participantes, meuId }: Parametros) {
    const [sonsAtivos, setSonsAtivos] = useState(lerPreferencia);
    const sonsAtivosRef = useRef(sonsAtivos);
    const contextoRef = useRef<AudioContext | null>(null);
    const conhecidosRef = useRef<Set<string> | null>(null);

    useEffect(() => {
        sonsAtivosRef.current = sonsAtivos;
    }, [sonsAtivos]);

    useEffect(() => {
        if (!meuId) return;

        const idsAtuais = new Set(participantes.map((p) => p.id).filter((id) => id !== meuId));
        const conhecidos = conhecidosRef.current;

        if (conhecidos === null) {
            conhecidosRef.current = idsAtuais;
            return;
        }

        const entraram = [...idsAtuais].filter((id) => !conhecidos.has(id));
        const sairam = [...conhecidos].filter((id) => !idsAtuais.has(id));
        conhecidosRef.current = idsAtuais;

        if (!sonsAtivosRef.current || (entraram.length === 0 && sairam.length === 0)) return;

        try {
            if (!contextoRef.current) {
                const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                contextoRef.current = new AudioContextCtor();
            }
            const contexto = contextoRef.current;
            void contexto.resume();

            if (entraram.length > 0) tocarTom(contexto, [440, 660], 0.22);
            if (sairam.length > 0) tocarTom(contexto, [520, 340], 0.22);
        } catch {}
    }, [participantes, meuId]);

    useEffect(() => {
        return () => {
            void contextoRef.current?.close();
        };
    }, []);

    function alternarSons() {
        const novo = !sonsAtivos;
        setSonsAtivos(novo);
        try {
            window.localStorage.setItem(CHAVE_SONS, novo ? '1' : '0');
        } catch {}
    }

    return { sonsAtivos, alternarSons };
}
