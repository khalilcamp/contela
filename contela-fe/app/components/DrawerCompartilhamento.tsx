'use client';

import { useEffect, useState } from 'react';
import {
    FonteCaptura,
    OPCOES_PADRAO,
    OpcoesCompartilhamento,
    Resolucao,
    TaxaQuadros,
    resumirOpcoes,
} from '../types/compartilhamento';
import { Enquadramento } from './Enquadramento';
import { IconFechar, IconMonitor } from './icons';

interface DrawerCompartilhamentoProps {
    aberto: boolean;
    onFechar: () => void;
    onIniciar: (opcoes: OpcoesCompartilhamento, fonteId: string | null, nomeFonte: string | null) => void;
}

const RESOLUCOES: { valor: Resolucao; rotulo: string }[] = [
    { valor: '720p', rotulo: '720p' },
    { valor: '1080p', rotulo: '1080p' },
    { valor: '1440p', rotulo: '1440p' },
    { valor: 'fonte', rotulo: 'Original' },
];
const ROLAGEM = '[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent]';

const TAXAS: { valor: TaxaQuadros; rotulo: string }[] = [
    { valor: 15, rotulo: '15' },
    { valor: 30, rotulo: '30' },
    { valor: 60, rotulo: '60' },
];

export function DrawerCompartilhamento({ aberto, onFechar, onIniciar }: DrawerCompartilhamentoProps) {
    const [desktop] = useState(() => typeof window !== 'undefined' && window.contela !== undefined);
    const [fontes, setFontes] = useState<FonteCaptura[]>([]);
    const [fonteId, setFonteId] = useState<string | null>(null);
    const [filtro, setFiltro] = useState('');
    const [opcoes, setOpcoes] = useState<OpcoesCompartilhamento>(OPCOES_PADRAO);

    useEffect(() => {
        if (!aberto || !desktop) return;
        let ativo = true;

        const carregar = async () => {
            try {
                const lista = await window.contela!.listarFontes();
                if (!ativo) return;
                setFontes(lista);
                setFonteId((atual) => atual ?? lista.find((f) => f.tipo === 'screen')?.id ?? null);
            } catch (erro) {
                console.error('Erro ao listar fontes de captura:', erro);
            }
        };

        carregar();
        const intervalo = setInterval(carregar, 3000);
        return () => {
            ativo = false;
            clearInterval(intervalo);
        };
    }, [aberto, desktop]);

    useEffect(() => {
        if (!aberto) return;
        const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
        window.addEventListener('keydown', aoTeclar);
        return () => window.removeEventListener('keydown', aoTeclar);
    }, [aberto, onFechar]);

    const selecionada = fontes.find((f) => f.id === fonteId) ?? null;
    const termo = filtro.trim().toLowerCase();
    const filtradas = fontes.filter((f) => f.name.toLowerCase().includes(termo));
    const telas = filtradas.filter((f) => f.tipo === 'screen');
    const janelas = filtradas.filter((f) => f.tipo === 'window');

    const janelaSelecionada = desktop && selecionada?.tipo === 'window';
    const audioIndisponivel = janelaSelecionada && !window.contela?.audioPorJanela;
    const podeIniciar = (!desktop || selecionada !== null) && !(opcoes.apenasAudio && audioIndisponivel);
    const audioAtivo = (opcoes.audio || opcoes.apenasAudio) && !audioIndisponivel;
    const rotuloAudio = !desktop ? 'Áudio' : janelaSelecionada ? 'Áudio da janela' : 'Áudio do sistema';
    const detalheAudio = audioIndisponivel
        ? 'Indisponível para janelas neste sistema. Compartilhe a tela inteira para incluir o som.'
        : janelaSelecionada
          ? 'Só o som desta janela, sem o resto do computador.'
          : desktop
            ? 'Todo o som do computador.'
            : null;
    const resumo = resumirOpcoes(opcoes);

    return (
        <>
            <div
                onClick={onFechar}
                className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-300 motion-reduce:transition-none ${
                    aberto ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            <aside
                role="dialog"
                aria-label="Compartilhar tela"
                aria-hidden={!aberto}
                inert={!aberto}
                className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-[440px] flex-col border-r border-line bg-ink-2/95 shadow-[24px_0_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
                    aberto ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <header className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-paper">Compartilhar</h2>
                    <button
                        onClick={onFechar}
                        aria-label="Fechar"
                        className="rounded-md p-1.5 text-mute transition hover:bg-ink-3 hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <IconFechar className="h-5 w-5" />
                    </button>
                </header>

                <div className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-2 pb-4 ${ROLAGEM}`}>
                    <Enquadramento className="aspect-[5/2] shrink-0 bg-ink">
                        {desktop && selecionada ? (
                            <div key={selecionada.id} className="animate-enquadrar absolute inset-0">
                                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura em data URL vinda do Electron */}
                                <img src={selecionada.thumbnail} alt="" className="h-full w-full bg-black object-contain" />
                                <p className="absolute bottom-2 left-3 right-3 truncate rounded bg-black/60 px-2 py-1 text-xs text-paper backdrop-blur-sm">
                                    {selecionada.name}
                                </p>
                            </div>
                        ) : (
                            <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-mute">
                                {desktop
                                    ? 'Escolha uma tela ou janela na lista abaixo.'
                                    : 'O navegador vai abrir o seletor dele para você escolher a aba, a janela ou a tela inteira.'}
                            </p>
                        )}
                    </Enquadramento>

                    {desktop && (
                        <section className="flex min-h-[9rem] flex-1 flex-col gap-3">
                            <input
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value)}
                                placeholder="Filtrar por nome"
                                aria-label="Filtrar telas e janelas"
                                className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-mute focus:border-signal focus:outline-none"
                            />

                            <div className={`-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 ${ROLAGEM}`}>
                                <Grupo titulo="Telas" fontes={telas} fonteId={fonteId} onEscolher={setFonteId} />
                                <Grupo titulo="Janelas" fontes={janelas} fonteId={fonteId} onEscolher={setFonteId} />

                                {telas.length + janelas.length === 0 && (
                                    <p className="text-sm text-mute">
                                        {termo ? 'Nada com esse nome. Limpe o filtro para ver tudo.' : 'Nada disponível para compartilhar.'}
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    <section className="shrink-0 space-y-4 border-t border-line pt-4">
                        <Interruptor
                            rotulo="Só o áudio"
                            detalhe={
                                opcoes.apenasAudio && audioIndisponivel
                                    ? 'Indisponível para janelas neste sistema. Escolha uma tela inteira.'
                                    : 'Transmite o som sem mostrar a imagem. Bom para música e jogos.'
                            }
                            marcado={opcoes.apenasAudio}
                            onChange={(apenasAudio) => setOpcoes((o) => ({ ...o, apenasAudio }))}
                        />

                        {!opcoes.apenasAudio && (
                            <>
                                <Regua
                                    titulo="Resolução"
                                    opcoes={RESOLUCOES}
                                    valor={opcoes.resolucao}
                                    onChange={(resolucao) => setOpcoes((o) => ({ ...o, resolucao }))}
                                />
                                <Regua
                                    titulo="Quadros por segundo"
                                    dica={opcoes.fps === 60 ? 'Mais fluido, bom para jogos e vídeo' : 'Mais nítido, bom para texto e código'}
                                    opcoes={TAXAS}
                                    valor={opcoes.fps}
                                    onChange={(fps) => setOpcoes((o) => ({ ...o, fps }))}
                                />

                                <Interruptor
                                    rotulo={rotuloAudio}
                                    detalhe={detalheAudio}
                                    marcado={audioAtivo}
                                    desativado={audioIndisponivel}
                                    onChange={(audio) => setOpcoes((o) => ({ ...o, audio }))}
                                />
                            </>
                        )}
                    </section>
                </div>

                <footer className="space-y-3 border-t border-line px-6 py-4">
                    <p className="text-xs text-mute">{resumo}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={onFechar}
                            className="rounded-lg px-4 py-2.5 text-sm text-mute transition hover:bg-ink-3 hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={!podeIniciar}
                            onClick={() => onIniciar({ ...opcoes, audio: audioAtivo }, desktop ? fonteId : null, desktop ? (selecionada?.name ?? null) : null)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <IconMonitor className="h-4 w-4" />
                            Continuar
                        </button>
                    </div>
                </footer>
            </aside>
        </>
    );
}

function Grupo({
    titulo,
    fontes,
    fonteId,
    onEscolher,
}: {
    titulo: string;
    fontes: FonteCaptura[];
    fonteId: string | null;
    onEscolher: (id: string) => void;
}) {
    if (fontes.length === 0) return null;
    return (
        <div>
            <div className="mb-1.5 flex items-baseline justify-between text-xs text-mute">
                <h3>{titulo}</h3>
                <span>{fontes.length}</span>
            </div>
            <ul className="space-y-0.5">
                {fontes.map((fonte) => {
                    const ativa = fonte.id === fonteId;
                    return (
                        <li key={fonte.id}>
                            <button
                                onClick={() => onEscolher(fonte.id)}
                                aria-pressed={ativa}
                                className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition focus-visible:outline-2 focus-visible:outline-signal ${
                                    ativa ? 'bg-ink-3' : 'hover:bg-ink-3/60'
                                }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura em data URL vinda do Electron */}
                                <img src={fonte.thumbnail} alt="" className="h-8 w-14 shrink-0 rounded-sm bg-black object-cover" />
                                <span className={`min-w-0 flex-1 truncate text-sm ${ativa ? 'text-paper' : 'text-mute'}`}>
                                    {fonte.name}
                                </span>
                                <span
                                    aria-hidden
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition ${ativa ? 'bg-signal' : 'bg-transparent'}`}
                                />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function Regua<T extends string | number>({
    titulo,
    dica,
    opcoes,
    valor,
    onChange,
}: {
    titulo: string;
    dica?: string;
    opcoes: { valor: T; rotulo: string }[];
    valor: T;
    onChange: (valor: T) => void;
}) {
    const n = opcoes.length;
    const indice = Math.max(0, opcoes.findIndex((o) => o.valor === valor));
    const margem = 100 / (2 * n);
    const preenchido = (indice / (n - 1)) * (100 - 2 * margem);

    return (
        <div>
            <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-sm text-paper">{titulo}</h3>
                {dica && <p className="text-xs text-mute">{dica}</p>}
            </div>
            <div role="radiogroup" aria-label={titulo} className="relative">
                <div aria-hidden className="absolute top-[7px] h-px bg-line" style={{ left: `${margem}%`, right: `${margem}%` }} />
                <div
                    aria-hidden
                    className="absolute top-[7px] h-px bg-signal transition-[width] duration-200 motion-reduce:transition-none"
                    style={{ left: `${margem}%`, width: `${preenchido}%` }}
                />
                <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                    {opcoes.map((o, i) => {
                        const ativa = i === indice;
                        return (
                            <button
                                key={o.valor}
                                role="radio"
                                aria-checked={ativa}
                                onClick={() => onChange(o.valor)}
                                className="group flex flex-col items-center gap-2 focus-visible:outline-none"
                            >
                                <span
                                    className={`h-[15px] w-[15px] rounded-full border-2 transition group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-signal motion-reduce:transition-none ${
                                        ativa
                                            ? 'border-signal bg-signal shadow-[0_0_0_4px_rgba(94,234,212,0.18)]'
                                            : i < indice
                                              ? 'border-signal bg-ink-2'
                                              : 'border-line bg-ink-2 group-hover:border-mute'
                                    }`}
                                />
                                <span className={`text-sm tabular-nums ${ativa ? 'font-medium text-paper' : 'text-mute'}`}>
                                    {o.rotulo}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function Interruptor({
    rotulo,
    detalhe,
    marcado,
    desativado = false,
    onChange,
}: {
    rotulo: string;
    detalhe?: string | null;
    marcado: boolean;
    desativado?: boolean;
    onChange: (valor: boolean) => void;
}) {
    return (
        <label
            className={`flex items-center justify-between gap-4 ${
                desativado ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
        >
            <span>
                <span className="block text-sm text-paper">{rotulo}</span>
                {detalhe && <span className="block text-xs text-mute">{detalhe}</span>}
            </span>
            <input
                type="checkbox"
                role="switch"
                disabled={desativado}
                checked={marcado}
                onChange={(e) => onChange(e.target.checked)}
                className="peer sr-only"
            />
            <span className="relative h-5 w-9 shrink-0 rounded-full border border-line bg-ink-3 transition peer-checked:border-signal peer-checked:bg-signal peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal after:absolute after:left-0.5 after:top-0.5 after:h-3.5 after:w-3.5 after:rounded-full after:bg-mute after:transition peer-checked:after:translate-x-4 peer-checked:after:bg-signal-ink motion-reduce:transition-none motion-reduce:after:transition-none" />
        </label>
    );
}
