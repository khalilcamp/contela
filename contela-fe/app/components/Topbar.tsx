'use client';

import { useEffect, useRef, useState } from 'react';
import { Integrante } from '../types/sala';
import { Avatar } from './Avatar';
import { DialogoSeguranca } from './DialogoSeguranca';
import { textoDoConvite, melhorLink } from '../lib/convite';
import { IconChat, IconCopiar, IconEscudo, IconLink, IconSair, IconTeclado, IconVolume, IconMudo } from './icons';
import { ListaParticipantes } from './ListaParticipantes';
import { AcaoTile } from './TileParticipante';

interface TopbarProps {
    salaId: string;
    senhaSala: string;
    participantes: Integrante[];
    meuId: string | null;
    donoId: string | null;
    souDono: boolean;
    acoesPara?: (participante: Integrante) => AcaoTile[];
    chatAberto: boolean;
    naoLidas: number;
    onToggleChat: () => void;
    onAbrirAtalhos: () => void;
    sonsAtivos: boolean;
    onAlternarSons: () => void;
    onSair: () => void;
}

export function Topbar({
    salaId,
    senhaSala,
    participantes,
    meuId,
    donoId,
    souDono,
    acoesPara,
    chatAberto,
    naoLidas,
    onToggleChat,
    onAbrirAtalhos,
    sonsAtivos,
    onAlternarSons,
    onSair,
}: TopbarProps) {
    const [copiado, setCopiado] = useState(false);
    const [linkCopiado, setLinkCopiado] = useState(false);
    const [segurancaAberta, setSegurancaAberta] = useState(false);
    const [listaAberta, setListaAberta] = useState(false);
    const listaRef = useRef<HTMLDivElement>(null);
    const emAndamento = participantes.some((p) => p.compartilhando);

    useEffect(() => {
        if (!listaAberta) return;
        const aoClicarFora = (e: MouseEvent) => {
            if (listaRef.current && !listaRef.current.contains(e.target as Node)) setListaAberta(false);
        };
        const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setListaAberta(false);
        document.addEventListener('mousedown', aoClicarFora);
        window.addEventListener('keydown', aoTeclar);
        return () => {
            document.removeEventListener('mousedown', aoClicarFora);
            window.removeEventListener('keydown', aoTeclar);
        };
    }, [listaAberta]);

    async function copiarConvite() {
        try {
            await navigator.clipboard.writeText(textoDoConvite(salaId, souDono ? senhaSala : undefined));
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {}
    }

    async function copiarLink() {
        try {
            await navigator.clipboard.writeText(melhorLink(salaId));
            setLinkCopiado(true);
            setTimeout(() => setLinkCopiado(false), 2000);
        } catch {}
    }

    return (
        <div className="relative z-40 mx-3 mt-3 flex h-12 shrink-0 items-center gap-3 rounded-xl border border-line bg-ink-2/80 px-4 backdrop-blur-xl">
            <span className="font-display text-sm font-semibold tracking-tight text-paper">Contela</span>
            <span aria-hidden className="h-4 w-px bg-line" />
            <button
                onClick={copiarConvite}
                title="Copiar convite"
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium tabular-nums text-paper transition hover:bg-ink-3 focus-visible:outline-2 focus-visible:outline-signal"
            >
                {salaId}
                {copiado ? (
                    <span className="text-xs font-normal text-signal">Copiado</span>
                ) : (
                    <IconCopiar className="h-3.5 w-3.5 text-mute" />
                )}
            </button>

            <button
                onClick={copiarLink}
                title="Copiar link da sala"
                aria-label="Copiar link da sala"
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-mute transition hover:bg-ink-3 hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
            >
                <IconLink className="h-3.5 w-3.5" />
                {linkCopiado && <span className="text-signal">Link copiado</span>}
            </button>

            {souDono && <span className="text-xs text-signal">Anfitrião</span>}

            {emAndamento && (
                <span className="flex items-center gap-1.5 rounded-md bg-live/15 px-2 py-0.5 text-xs font-medium text-live">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" />
                    No ar
                </span>
            )}

            <div className="ml-auto flex items-center gap-3">
                <div ref={listaRef} className="relative">
                    <button
                        onClick={() => setListaAberta((aberta) => !aberta)}
                        aria-label="Ver participantes"
                        aria-expanded={listaAberta}
                        title="Ver participantes"
                        className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-ink-3 focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <span className="flex -space-x-2">
                            {participantes.slice(0, 5).map((p) => (
                                <span key={p.id}>
                                    <Avatar id={p.id} nome={p.nome} tamanho={28} compartilhando={p.compartilhando} cor={p.cor} chapeu={p.chapeu} />
                                </span>
                            ))}
                        </span>
                        {participantes.length > 0 && <span className="text-xs text-mute">{participantes.length}</span>}
                    </button>

                    {listaAberta && (
                        <ListaParticipantes
                            participantes={participantes}
                            meuId={meuId}
                            donoId={donoId}
                            acoesPara={acoesPara}
                        />
                    )}
                </div>

                <button
                    onClick={() => setSegurancaAberta(true)}
                    title="Privacidade, segurança e denúncias"
                    aria-label="Privacidade, segurança e denúncias"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-3 text-mute transition hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                    <IconEscudo className="h-4 w-4" />
                </button>

                <button
                    onClick={onAbrirAtalhos}
                    title="Atalhos de teclado (?)"
                    aria-label="Atalhos de teclado"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-3 text-mute transition hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                    <IconTeclado className="h-4 w-4" />
                </button>

                <button
                    onClick={onAlternarSons}
                    aria-pressed={sonsAtivos}
                    title={sonsAtivos ? 'Sons de entrada/saída ligados' : 'Sons de entrada/saída desligados'}
                    aria-label="Sons de entrada e saída da sala"
                    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-ink-3 transition hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                        sonsAtivos ? 'text-signal' : 'text-mute'
                    }`}
                >
                    {sonsAtivos ? <IconVolume className="h-4 w-4" /> : <IconMudo className="h-4 w-4" />}
                </button>

                <button
                    onClick={onToggleChat}
                    title="Chat"
                    aria-pressed={chatAberto}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                        chatAberto ? 'bg-signal text-signal-ink' : 'bg-ink-3 text-mute hover:text-paper'
                    }`}
                >
                    <IconChat className="h-4 w-4" />
                    {naoLidas > 0 && (
                        <span
                            aria-label={`${naoLidas} mensagens não lidas`}
                            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-live px-1 text-[10px] font-semibold leading-none text-white"
                        >
                            {naoLidas > 9 ? '9+' : naoLidas}
                        </span>
                    )}
                </button>

                <button
                    onClick={onSair}
                    title="Sair da sala"
                    aria-label="Sair da sala"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-3 text-mute transition hover:bg-live hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-live"
                >
                    <IconSair className="h-4 w-4" />
                </button>
            </div>

            <DialogoSeguranca aberto={segurancaAberta} onFechar={() => setSegurancaAberta(false)} salaId={salaId} />
        </div>
    );
}
