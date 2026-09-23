'use client';

import { useEffect, useRef, useState } from 'react';
import { IconMudo, IconTelaCheia, IconVolume } from './icons';
import { Mascote } from './Mascote';

interface VideoTransmissaoProps {
    stream: MediaStream | null;
    mudo: boolean;
    controles?: boolean;
    silenciado: boolean;
    onSilenciadoChange: (silenciado: boolean) => void;
    className?: string;
}

const CHAVE_VOLUME = 'contela:volume';
const ESCALA_MINIMA = 1;
const ESCALA_MAXIMA = 4;
const PASSO_ESCALA = 0.2;
const LIMITE_ARRASTO_PX = 4;

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

export function VideoTransmissao({
    stream,
    mudo,
    controles = false,
    silenciado,
    onSilenciadoChange,
    className,
}: VideoTransmissaoProps) {
    const ref = useRef<HTMLVideoElement>(null);
    const recipienteRef = useRef<HTMLDivElement>(null);
    const arrastoRef = useRef<{ x0: number; y0: number; panX0: number; panY0: number; moveu: boolean } | null>(null);
    const [volume, setVolume] = useState(lerVolumeSalvo);
    const [temVideo, setTemVideo] = useState(true);
    const [escala, setEscala] = useState(ESCALA_MINIMA);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [streamAnterior, setStreamAnterior] = useState(stream);

    if (stream !== streamAnterior) {
        setStreamAnterior(stream);
        setEscala(ESCALA_MINIMA);
        setPan({ x: 0, y: 0 });
    }

    useEffect(() => {
        if (!stream) return;
        const atualizar = () => setTemVideo(stream.getVideoTracks().length > 0);
        atualizar();
        stream.addEventListener('addtrack', atualizar);
        stream.addEventListener('removetrack', atualizar);
        return () => {
            stream.removeEventListener('addtrack', atualizar);
            stream.removeEventListener('removetrack', atualizar);
        };
    }, [stream]);

    useEffect(() => {
        const video = ref.current;
        if (video && video.srcObject !== stream) video.srcObject = stream;
    }, [stream]);

    useEffect(() => {
        const video = ref.current;
        if (video) video.volume = volume;
    }, [volume]);

    function aoRodarRoda(e: React.WheelEvent) {
        if (!temVideo) return;
        e.preventDefault();
        setEscala((atual) => {
            const novo = Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, atual + (e.deltaY < 0 ? PASSO_ESCALA : -PASSO_ESCALA)));
            if (novo === ESCALA_MINIMA) setPan({ x: 0, y: 0 });
            return novo;
        });
    }

    function aoPressionarPonteiro(e: React.PointerEvent) {
        if (!temVideo || escala <= ESCALA_MINIMA) return;
        arrastoRef.current = { x0: e.clientX, y0: e.clientY, panX0: pan.x, panY0: pan.y, moveu: false };
        e.currentTarget.setPointerCapture(e.pointerId);
    }

    function aoMoverPonteiro(e: React.PointerEvent) {
        const inicio = arrastoRef.current;
        if (!inicio) return;
        const dx = e.clientX - inicio.x0;
        const dy = e.clientY - inicio.y0;
        if (Math.abs(dx) > LIMITE_ARRASTO_PX || Math.abs(dy) > LIMITE_ARRASTO_PX) inicio.moveu = true;
        if (inicio.moveu) {
            setPan({ x: inicio.panX0 + dx / escala, y: inicio.panY0 + dy / escala });
        }
    }

    function aoSoltarPonteiro() {
        arrastoRef.current = null;
    }

    function redefinirZoom() {
        setEscala(ESCALA_MINIMA);
        setPan({ x: 0, y: 0 });
    }

    function alterarVolume(novo: number) {
        setVolume(novo);
        onSilenciadoChange(novo === 0);
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
        <div ref={recipienteRef} className="group relative h-full w-full overflow-hidden bg-black">
            <div
                className="h-full w-full"
                style={{
                    transform: `scale(${escala}) translate(${pan.x}px, ${pan.y}px)`,
                    transformOrigin: 'center center',
                    cursor: escala > ESCALA_MINIMA ? 'grab' : undefined,
                }}
                onWheel={aoRodarRoda}
                onPointerDown={aoPressionarPonteiro}
                onPointerMove={aoMoverPonteiro}
                onPointerUp={aoSoltarPonteiro}
                onDoubleClick={redefinirZoom}
            >
                <video ref={ref} autoPlay muted={mudo || silenciado} playsInline className={temVideo ? className : 'hidden'} />
            </div>

            {stream && !temVideo && <SomenteAudio />}

            {escala > ESCALA_MINIMA && (
                <button
                    onClick={redefinirZoom}
                    className="absolute left-3 top-3 rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-paper backdrop-blur-sm transition hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-signal"
                >
                    Redefinir zoom
                </button>
            )}

            {controles && (
                <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-black/70 px-2.5 py-1.5 text-paper opacity-0 backdrop-blur-sm transition focus-within:opacity-100 group-hover:opacity-100">
                    <button
                        onClick={() => onSilenciadoChange(!silenciado)}
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
                    {temVideo && (
                    <button
                        onClick={alternarTelaCheia}
                        aria-label="Tela cheia"
                        title="Tela cheia"
                        className="rounded p-1 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <IconTelaCheia className="h-4 w-4" />
                    </button>
                    )}
                </div>
            )}
        </div>
    );
}

function SomenteAudio() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink">
            <Mascote acento="#5eead4" estagioVisual={2} className="h-28 w-28" />
            <div aria-hidden className="flex h-8 items-end gap-1.5">
                {[0, 0.25, 0.5, 0.15, 0.4].map((atraso, i) => (
                    <span
                        key={i}
                        className="equalizador-barra h-full w-1.5 rounded-full bg-signal"
                        style={{ animationDelay: `${atraso}s` }}
                    />
                ))}
            </div>
            <p className="text-sm text-mute">Só o áudio está sendo transmitido</p>
        </div>
    );
}
