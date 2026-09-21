'use client';

import { useState } from 'react';
import { Integrante } from '../types/sala';
import { Avatar } from './Avatar';
import { DialogoSeguranca } from './DialogoSeguranca';
import { IconChat, IconCopiar, IconEscudo, IconSair } from './icons';

interface TopbarProps {
    salaId: string;
    senhaSala: string;
    participantes: Integrante[];
    souDono: boolean;
    chatAberto: boolean;
    onToggleChat: () => void;
    onSair: () => void;
}

export function Topbar({ salaId, senhaSala, participantes, souDono, chatAberto, onToggleChat, onSair }: TopbarProps) {
    const [copiado, setCopiado] = useState(false);
    const [segurancaAberta, setSegurancaAberta] = useState(false);
    const emAndamento = participantes.some((p) => p.compartilhando);

    async function copiarConvite() {
        const convite = window.location.protocol.startsWith('http')
            ? `${window.location.origin}/?sala=${salaId}`
            : salaId;
        const texto = souDono && senhaSala ? `${convite}\nSenha: ${senhaSala}` : convite;
        try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {}
    }

    return (
        <div className="mx-3 mt-3 flex h-12 shrink-0 items-center gap-3 rounded-xl border border-line bg-ink-2/80 px-4 backdrop-blur-xl">
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

            {souDono && <span className="text-xs text-signal">Anfitrião</span>}

            {emAndamento && (
                <span className="flex items-center gap-1.5 rounded-md bg-live/15 px-2 py-0.5 text-xs font-medium text-live">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" />
                    No ar
                </span>
            )}

            <div className="ml-auto flex items-center gap-3">
                <div className="flex -space-x-2">
                    {participantes.slice(0, 5).map((p) => (
                        <div key={p.id} title={p.nome}>
                            <Avatar id={p.id} nome={p.nome} tamanho={28} compartilhando={p.compartilhando} />
                        </div>
                    ))}
                </div>
                {participantes.length > 0 && <span className="text-xs text-mute">{participantes.length}</span>}

                <button
                    onClick={() => setSegurancaAberta(true)}
                    title="Privacidade, segurança e denúncias"
                    aria-label="Privacidade, segurança e denúncias"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-3 text-mute transition hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                    <IconEscudo className="h-4 w-4" />
                </button>

                <button
                    onClick={onToggleChat}
                    title="Chat"
                    aria-pressed={chatAberto}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                        chatAberto ? 'bg-signal text-signal-ink' : 'bg-ink-3 text-mute hover:text-paper'
                    }`}
                >
                    <IconChat className="h-4 w-4" />
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
