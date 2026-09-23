import { Integrante } from '../types/sala';
import { Avatar } from './Avatar';
import { IconMudo, IconVolume } from './icons';
import { AcaoTile } from './TileParticipante';

interface ListaParticipantesProps {
    participantes: Integrante[];
    meuId: string | null;
    donoId: string | null;
    acoesPara?: (participante: Integrante) => AcaoTile[];
    estaMudo: (nome: string) => boolean;
    onAlternarMudo: (nome: string) => void;
}

export function ListaParticipantes({
    participantes,
    meuId,
    donoId,
    acoesPara,
    estaMudo,
    onAlternarMudo,
}: ListaParticipantesProps) {
    return (
        <div
            role="dialog"
            aria-label="Participantes da sala"
            className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-line bg-ink-2 p-2 shadow-2xl shadow-black/50"
        >
            <h2 className="px-2 pb-1 pt-1 text-xs text-mute">
                {participantes.length} {participantes.length === 1 ? 'pessoa na sala' : 'pessoas na sala'}
            </h2>
            <ul className="max-h-80 space-y-0.5 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
                {participantes.map((p) => {
                    const acoes = acoesPara?.(p) ?? [];
                    const mudo = p.id !== meuId && estaMudo(p.nome);
                    return (
                        <li key={p.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink-3/60">
                            <Avatar id={p.id} nome={p.nome} tamanho={30} compartilhando={p.compartilhando} cor={p.cor} chapeu={p.chapeu} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-paper">
                                    {p.nome}
                                    {p.id === meuId ? ' (você)' : ''}
                                </p>
                                <p className="flex gap-2 text-xs">
                                    {p.id === donoId && <span className="text-signal">Anfitrião</span>}
                                    {p.compartilhando && <span className="text-live">No ar</span>}
                                    {mudo && <span className="text-mute">Mudo pra você</span>}
                                </p>
                            </div>
                            {p.id !== meuId && (
                                <button
                                    onClick={() => onAlternarMudo(p.nome)}
                                    aria-pressed={mudo}
                                    title={mudo ? `Reativar áudio de ${p.nome} pra você` : `Silenciar ${p.nome} só pra você`}
                                    aria-label={mudo ? `Reativar áudio de ${p.nome}` : `Silenciar ${p.nome}`}
                                    className={`shrink-0 rounded p-1.5 transition focus-visible:outline-2 focus-visible:outline-signal ${
                                        mudo ? 'text-live' : 'text-mute hover:bg-ink-3 hover:text-paper'
                                    }`}
                                >
                                    {mudo ? <IconMudo className="h-4 w-4" /> : <IconVolume className="h-4 w-4" />}
                                </button>
                            )}
                            {acoes.map((acao) => (
                                <button
                                    key={acao.rotulo}
                                    onClick={acao.onClick}
                                    className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-signal ${
                                        acao.perigo
                                            ? 'text-live hover:bg-live hover:text-white'
                                            : 'text-paper hover:bg-ink-3'
                                    }`}
                                >
                                    {acao.rotulo}
                                </button>
                            ))}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
