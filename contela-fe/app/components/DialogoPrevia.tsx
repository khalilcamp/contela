'use client';

import { useEffect, useRef, useState } from 'react';
import type { PreviaTransmissao } from '../hooks/useSalaConexao';
import { resumirOpcoes } from '../types/compartilhamento';
import { Enquadramento } from './Enquadramento';
import { IconMonitor } from './icons';
import { Mascote } from './Mascote';

interface DialogoPreviaProps {
    previa: PreviaTransmissao;
    onIrAoVivo: () => void;
    onVoltar: () => void;
    onCancelar: () => void;
}

const SEGMENTOS = 16;

function useNivelAudio(stream: MediaStream) {
    const [nivel, setNivel] = useState(0);
    const [detectado, setDetectado] = useState(false);

    useEffect(() => {
        const faixas = stream.getAudioTracks();
        if (faixas.length === 0) return;

        const contexto = new AudioContext();
        void contexto.resume();
        const fonte = contexto.createMediaStreamSource(new MediaStream(faixas));
        const analisador = contexto.createAnalyser();
        analisador.fftSize = 1024;
        fonte.connect(analisador);

        const amostras = new Uint8Array(analisador.fftSize);
        let quadro = 0;
        let ultimo = 0;

        const laco = (agora: number) => {
            quadro = requestAnimationFrame(laco);
            if (agora - ultimo < 60) return;
            ultimo = agora;

            analisador.getByteTimeDomainData(amostras);
            let soma = 0;
            for (const v of amostras) {
                const x = (v - 128) / 128;
                soma += x * x;
            }
            const atual = Math.min(1, Math.sqrt(soma / amostras.length) * 6);
            setNivel(atual);
            if (atual > 0.02) setDetectado(true);
        };
        quadro = requestAnimationFrame(laco);

        return () => {
            cancelAnimationFrame(quadro);
            fonte.disconnect();
            void contexto.close();
        };
    }, [stream]);

    return { nivel, detectado };
}

export function DialogoPrevia({ previa, onIrAoVivo, onVoltar, onCancelar }: DialogoPreviaProps) {
    const { stream, opcoes, nomeFonte, semAudio } = previa;
    const videoRef = useRef<HTMLVideoElement>(null);
    const { nivel, detectado } = useNivelAudio(stream);
    const temAudio = stream.getAudioTracks().length > 0;
    const legenda = nomeFonte ?? stream.getVideoTracks()[0]?.label ?? null;

    useEffect(() => {
        const video = videoRef.current;
        if (video && video.srcObject !== stream) video.srcObject = stream;
    }, [stream]);

    useEffect(() => {
        const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onCancelar();
        window.addEventListener('keydown', aoTeclar);
        return () => window.removeEventListener('keydown', aoTeclar);
    }, [onCancelar]);

    const acesos = Math.round(nivel * SEGMENTOS);
    const estadoAudio = semAudio
        ? 'Não foi possível capturar o áudio dessa janela. Você vai transmitir sem som.'
        : !temAudio
          ? 'Sem áudio nesta transmissão.'
          : detectado
            ? 'Som detectado.'
            : 'Nenhum som por enquanto. Toque algo para testar.';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-previa"
                className="flex max-h-full w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-ink-2 p-6 shadow-2xl"
            >
                <header>
                    <h2 id="titulo-previa" className="font-display text-xl font-semibold tracking-tight text-paper">
                        Está certo?
                    </h2>
                    <p className="mt-1 text-sm text-mute">
                        {opcoes.apenasAudio
                            ? 'Confira o que todos na sala vão ouvir antes de ir ao vivo.'
                            : 'Confira o que vai aparecer para todos na sala antes de ir ao vivo.'}
                    </p>
                </header>

                <Enquadramento className="aspect-video shrink-0 bg-black">
                    {opcoes.apenasAudio ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink">
                            <Mascote acento="#5eead4" estagioVisual={2} className="h-20 w-20" />
                            <p className="text-sm text-mute">Só o som será transmitido</p>
                        </div>
                    ) : (
                        <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
                    )}
                    {legenda && (
                        <p className="absolute bottom-2 left-3 right-3 truncate rounded bg-black/60 px-2 py-1 text-xs text-paper backdrop-blur-sm">
                            {legenda}
                        </p>
                    )}
                </Enquadramento>

                <div>
                    <div
                        role="meter"
                        aria-label="Nível do som"
                        aria-valuemin={0}
                        aria-valuemax={SEGMENTOS}
                        aria-valuenow={acesos}
                        className="flex h-3 gap-0.5"
                    >
                        {Array.from({ length: SEGMENTOS }, (_, i) => (
                            <span
                                key={i}
                                className={`h-full flex-1 rounded-sm transition-colors duration-75 ${
                                    !temAudio ? 'bg-ink-3 opacity-50' : i < acesos ? 'bg-signal' : 'bg-ink-3'
                                }`}
                            />
                        ))}
                    </div>
                    <p className={`mt-2 text-xs ${semAudio ? 'text-live' : 'text-mute'}`}>{estadoAudio}</p>
                </div>

                <p className="text-xs text-mute">{resumirOpcoes(opcoes)}</p>

                <div className="flex gap-2">
                    <button
                        onClick={onVoltar}
                        className="rounded-lg px-4 py-2.5 text-sm text-mute transition hover:bg-ink-3 hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        Voltar
                    </button>
                    <button
                        autoFocus
                        onClick={onIrAoVivo}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                    >
                        <IconMonitor className="h-4 w-4" />
                        Ir ao vivo
                    </button>
                </div>
            </div>
        </div>
    );
}
