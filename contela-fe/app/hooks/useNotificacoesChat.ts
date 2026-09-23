'use client';

import { useEffect, useRef, useState } from 'react';
import type { MensagemResponse } from '../types/sala';
import { mensagemMenciona } from '../lib/mencoes';

const CHAVE_NOTIFICACOES = 'contela:notificacoes';
const TITULO_APP = 'Contela';

function lerPreferencia(): boolean {
    try {
        return window.localStorage.getItem(CHAVE_NOTIFICACOES) !== '0';
    } catch {
        return true;
    }
}

function semFoco(): boolean {
    return document.hidden || !document.hasFocus();
}

export function desenharContador(quantidade: number): string | null {
    const tela = document.createElement('canvas');
    tela.width = 32;
    tela.height = 32;
    const c = tela.getContext('2d');
    if (!c) return null;
    c.fillStyle = '#ff5c5c';
    c.beginPath();
    c.arc(16, 16, 15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = 'bold 18px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(quantidade > 9 ? '9+' : String(quantidade), 16, 17);
    return tela.toDataURL('image/png');
}

interface Parametros {
    mensagens: MensagemResponse[];
    meuId: string | null;
    meuNome: string | null;
    chatAberto: boolean;
    onAbrirChat: () => void;
}

export function useNotificacoesChat({ mensagens, meuId, meuNome, chatAberto, onAbrirChat }: Parametros) {
    const [naoLidas, setNaoLidas] = useState(0);
    const [ativas, setAtivas] = useState(lerPreferencia);
    const processadasRef = useRef(mensagens.length);
    const estadoRef = useRef({ ativas, chatAberto, onAbrirChat });

    useEffect(() => {
        estadoRef.current = { ativas, chatAberto, onAbrirChat };
    });

    useEffect(() => {
        const novas = mensagens.slice(processadasRef.current);
        processadasRef.current = mensagens.length;

        for (const m of novas) {
            if (m.integranteId === meuId) continue;
            const fora = semFoco();
            if (fora || !estadoRef.current.chatAberto) setNaoLidas((n) => n + 1);
            if (fora && estadoRef.current.ativas) notificar(m, meuNome, estadoRef.current.onAbrirChat);
        }
    }, [mensagens, meuId, meuNome]);

    useEffect(() => {
        const zerar = () => {
            if (!document.hidden && document.hasFocus() && estadoRef.current.chatAberto) setNaoLidas(0);
        };
        zerar();
        window.addEventListener('focus', zerar);
        document.addEventListener('visibilitychange', zerar);
        return () => {
            window.removeEventListener('focus', zerar);
            document.removeEventListener('visibilitychange', zerar);
        };
    }, [chatAberto]);

    useEffect(() => {
        document.title = naoLidas > 0 ? `(${naoLidas}) ${TITULO_APP}` : TITULO_APP;
        window.contela?.definirNaoLidas?.(naoLidas, naoLidas > 0 ? desenharContador(naoLidas) : null).catch(() => {});
    }, [naoLidas]);

    useEffect(() => {
        return () => {
            document.title = TITULO_APP;
            window.contela?.definirNaoLidas?.(0, null).catch(() => {});
        };
    }, []);

    useEffect(() => {
        if (window.contela || !ativas || typeof Notification === 'undefined' || Notification.permission !== 'default') return;
        const pedir = () => void Notification.requestPermission();
        window.addEventListener('pointerdown', pedir, { once: true });
        return () => window.removeEventListener('pointerdown', pedir);
    }, [ativas]);

    function alternarNotificacoes() {
        const novo = !ativas;
        setAtivas(novo);
        try {
            window.localStorage.setItem(CHAVE_NOTIFICACOES, novo ? '1' : '0');
        } catch {}
        if (novo && !window.contela && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            void Notification.requestPermission();
        }
    }

    return { naoLidas, notificacoes: ativas, alternarNotificacoes };
}

function notificar(mensagem: MensagemResponse, meuNome: string | null, abrirChat: () => void) {
    const corpo = mensagem.texto.slice(0, 200);
    const titulo =
        mensagem.tipo !== 'GIF' && mensagemMenciona(mensagem.texto, meuNome)
            ? `${mensagem.nomeIntegrante} mencionou você`
            : mensagem.nomeIntegrante;

    if (window.contela?.notificar) {
        window.contela.notificar({ titulo, corpo }).catch(() => {});
        return;
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
        const aviso = new Notification(titulo, { body: corpo, tag: 'contela-chat' });
        aviso.onclick = () => {
            window.focus();
            abrirChat();
            aviso.close();
        };
    } catch {}
}
