'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ContextoDiagnostico,
    DiagnosticoPeer,
    formatarResolucao,
    formatarTaxa,
    montarTextoDiagnostico,
    resumirConexoes,
    rotuloVia,
} from '../lib/diagnostico';
import { IconCopiar, IconFechar } from './icons';

interface DialogoDiagnosticoProps {
    aberto: boolean;
    onFechar: () => void;
    diagnostico: DiagnosticoPeer[];
    nomes: Map<string, string>;
    contexto: ContextoDiagnostico;
}

const EXPLICACAO = {
    direta: 'Os computadores se falam direto. É o melhor caso: menor atraso e sem custo de servidor.',
    retransmissao:
        'O vídeo passa por um servidor de retransmissão (TURN) porque a conexão direta não foi possível. Funciona, mas pode ter mais atraso.',
    indefinida: 'Ainda não foi possível determinar o caminho da conexão.',
} as const;

export function DialogoDiagnostico({ aberto, onFechar, diagnostico, nomes, contexto }: DialogoDiagnosticoProps) {
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (!aberto) return;
        const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
        window.addEventListener('keydown', aoTeclar);
        return () => window.removeEventListener('keydown', aoTeclar);
    }, [aberto, onFechar]);

    if (!aberto) return null;

    const { rotulo } = resumirConexoes(diagnostico);

    async function copiar() {
        try {
            await navigator.clipboard.writeText(montarTextoDiagnostico(contexto, diagnostico));
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {}
    }

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div onClick={onFechar} className="absolute inset-0 bg-black/60" />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-diagnostico"
                className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-ink-2 shadow-2xl shadow-black/60"
            >
                <header className="flex items-center justify-between border-b border-line px-6 py-4">
                    <div>
                        <h2 id="titulo-diagnostico" className="font-display text-lg font-semibold tracking-tight text-paper">
                            Diagnóstico da conexão
                        </h2>
                        <p className="text-xs text-mute">Situação geral: {rotulo}</p>
                    </div>
                    <button
                        onClick={onFechar}
                        aria-label="Fechar"
                        className="rounded-md p-1.5 text-mute transition hover:bg-ink-3 hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <IconFechar className="h-5 w-5" />
                    </button>
                </header>

                <div className="space-y-4 overflow-y-auto px-6 py-5 text-sm text-paper/80 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
                    {diagnostico.length === 0 ? (
                        <p>Nenhuma conexão de vídeo ativa. Quando alguém começar a transmitir, os dados aparecem aqui.</p>
                    ) : (
                        diagnostico.map((p) => (
                            <section key={p.peerId} className="rounded-lg border border-line bg-ink p-4">
                                <h3 className="mb-2 font-medium text-paper">{nomes.get(p.peerId) ?? 'Participante'}</h3>
                                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                    <dt className="text-mute">Caminho</dt>
                                    <dd>{rotuloVia(p.via)}</dd>
                                    <dt className="text-mute">Estado</dt>
                                    <dd>
                                        {p.estadoIce} / {p.estadoConexao}
                                    </dd>
                                    <dt className="text-mute">Latência</dt>
                                    <dd>{p.rttMs === null ? '-' : `${Math.round(p.rttMs)} ms`}</dd>
                                    <dt className="text-mute">Recebendo</dt>
                                    <dd>{formatarTaxa(p.kbpsRecebendo)}</dd>
                                    <dt className="text-mute">Enviando</dt>
                                    <dd>{formatarTaxa(p.kbpsEnviando)}</dd>
                                    <dt className="text-mute">Vídeo</dt>
                                    <dd>{formatarResolucao(p.largura, p.altura, p.fps)}</dd>
                                    <dt className="text-mute">Perda de pacotes</dt>
                                    <dd>{p.perdaPct === null ? '-' : `${p.perdaPct.toFixed(1)}%`}</dd>
                                    {p.limitacao && p.limitacao !== 'none' && (
                                        <>
                                            <dt className="text-mute">Limitado por</dt>
                                            <dd>{p.limitacao}</dd>
                                        </>
                                    )}
                                </dl>
                                <p className="mt-3 text-xs text-mute">{EXPLICACAO[p.via]}</p>
                            </section>
                        ))
                    )}

                    <p className="text-xs text-mute">
                        O texto copiado não inclui endereços IP nem senhas, então pode ser enviado a quem está ajudando
                        a resolver o problema.
                    </p>
                </div>

                <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">
                    <button
                        onClick={copiar}
                        className="flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                    >
                        <IconCopiar className="h-4 w-4" />
                        {copiado ? 'Diagnóstico copiado' : 'Copiar diagnóstico'}
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}
