'use client';

import { useEffect, useRef, useState } from 'react';
import { IconMudo, IconTelaCheia, IconVolume } from './icons';

interface VideoTransmissaoProps {
    stream: MediaStream | null;
    mudo: boolean;
    controles?: boolean;
    className?: string;
}

const CHAVE_VOLUME = 'contela:volume';

function lerVolumeSalvo(): number {
    try {
        const salvo = Number(window.localStorage.getItem(CHAVE_VOLUME));
        return Number.isFinite(salvo) && salvo >= 0 && salvo <= 1 && window.localStorage.getItem(CHAVE_VOLUME) !== null
            ? salvo
            : 1;
    } catch {
        return 1;
    }
}

export function VideoTransmissao({ stream, mudo, controles = false, className }: VideoTransmissaoProps) {
    const ref = useRef<HTMLVideoElement>(null);
    const recipienteRef = useRef<HTMLDivElement>(null);
    const [volume, setVolume] = useState(lerVolumeSalvo);
    const [silenciado, setSilenciado] = useState(false);

    useEffect(() => {
        const video = ref.current;
        if (video && video.srcObject !== stream) video.srcObject = stream;
    }, [stream]);

    useEffect(() => {
        const video = ref.current;
        if (video) video.volume = volume;
    }, [volume]);

    function alterarVolume(novo: number) {
        setVolume(novo);
        setSilenciado(novo === 0);
        try {
            window.localStorage.setItem(CHAVE_VOLUME, String(novo));
        } catch {}
    }

    function alternarTelaCheia() {
        const recipiente = recipienteRef.current;
        if (!recipiente) return;
        if (document.fullscreenElement) void document.exitFullscreen();
        else void recipiente.requestFullscreen();
    }

    const semSom = mudo || silenciado || volume === 0;

    return (
        <div ref={recipienteRef} className="group relative h-full w-full bg-black">
            <video ref={ref} autoPlay muted={mudo || silenciado} playsInline className={className} />

            {controles && (
                <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-black/70 px-2.5 py-1.5 text-paper opacity-0 backdrop-blur-sm transition focus-within:opacity-100 group-hover:opacity-100">
                    <button
                        onClick={() => setSilenciado((atual) => !atual)}
                        aria-label={semSom ? 'Ativar som' : 'Silenciar'}
                        title={semSom ? 'Ativar som' : 'Silenciar'}
                        className="rounded p-1 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        {semSom ? <IconMudo className="h-4 w-4" /> : <IconVolume className="h-4 w-4" />}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={silenciado ? 0 : volume}
                        onChange={(e) => alterarVolume(Number(e.target.value))}
                        aria-label="Volume"
                        className="h-1 w-24 cursor-pointer accent-[#5eead4]"
                    />
                    <button
                        onClick={alternarTelaCheia}
                        aria-label="Tela cheia"
                        title="Tela cheia"
                        className="rounded p-1 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <IconTelaCheia className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
