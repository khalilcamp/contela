import { useEffect, useRef, useState } from 'react';
import { buscarGifs, GifResultado } from '../lib/giphy';

interface SeletorGifProps {
    onSelecionar: (url: string) => void;
    onFechar: () => void;
}

export function SeletorGif({ onSelecionar, onFechar }: SeletorGifProps) {
    const [consulta, setConsulta] = useState('');
    const [resultados, setResultados] = useState<GifResultado[]>([]);
    const [carregando, setCarregando] = useState(true);
    const raizRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const aoClicarFora = (e: MouseEvent) => {
            if (raizRef.current && !raizRef.current.contains(e.target as Node)) onFechar();
        };
        const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
        document.addEventListener('mousedown', aoClicarFora);
        window.addEventListener('keydown', aoTeclar);
        return () => {
            document.removeEventListener('mousedown', aoClicarFora);
            window.removeEventListener('keydown', aoTeclar);
        };
    }, [onFechar]);

    useEffect(() => {
        let ativo = true;
        const atraso = setTimeout(() => {
            buscarGifs(consulta).then((r) => {
                if (ativo) {
                    setResultados(r);
                    setCarregando(false);
                }
            });
        }, 300);
        return () => {
            ativo = false;
            clearTimeout(atraso);
        };
    }, [consulta]);

    return (
        <div
            ref={raizRef}
            role="dialog"
            aria-label="Buscar GIF"
            className="absolute bottom-full left-0 z-40 mb-2 w-80 rounded-xl border border-line bg-ink-2 p-2 shadow-2xl shadow-black/50"
        >
            <input
                autoFocus
                value={consulta}
                onChange={(e) => {
                    setConsulta(e.target.value);
                    setCarregando(true);
                }}
                placeholder="Buscar GIF"
                className="w-full rounded-lg border border-line bg-ink px-3 py-1.5 text-sm text-paper outline-none placeholder:text-mute focus:border-signal"
            />

            <div className="mt-2 grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
                {carregando && <p className="col-span-2 py-6 text-center text-sm text-mute">Buscando...</p>}
                {!carregando && resultados.length === 0 && (
                    <p className="col-span-2 py-6 text-center text-sm text-mute">Nenhum GIF encontrado.</p>
                )}
                {!carregando &&
                    resultados.map((gif) => (
                        <button
                            key={gif.id}
                            onClick={() => onSelecionar(gif.url)}
                            title={gif.descricao}
                            className="overflow-hidden rounded-lg border border-transparent transition hover:border-signal focus-visible:outline-2 focus-visible:outline-signal"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- GIF externo do Giphy, sem otimizacao do next/image */}
                            <img src={gif.urlPreview} alt={gif.descricao} className="h-24 w-full object-cover" loading="lazy" />
                        </button>
                    ))}
            </div>
        </div>
    );
}
