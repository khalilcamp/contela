import type { ChapeuEscolha } from '../types/sala';
import { Avatar } from './Avatar';

export interface AcaoTile {
    rotulo: string;
    onClick: () => void;
    perigo?: boolean;
}

interface TileParticipanteProps {
    id: string;
    nome: string;
    meuId: string | null;
    compartilhando?: boolean;
    cor?: string | null;
    chapeu?: ChapeuEscolha | null;
    tamanhoAvatar?: number;
    acoes?: AcaoTile[];
}

export function TileParticipante({
    id,
    nome,
    meuId,
    compartilhando,
    cor,
    chapeu,
    tamanhoAvatar = 56,
    acoes = [],
}: TileParticipanteProps) {
    return (
        <div
            className={`group relative flex aspect-square h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border bg-ink-2 p-2 ${
                compartilhando ? 'border-signal' : 'border-line'
            }`}
        >
            <Avatar id={id} nome={nome} tamanho={tamanhoAvatar} compartilhando={compartilhando} cor={cor} chapeu={chapeu} />
            <span className="max-w-full truncate rounded-md bg-black/40 px-2 py-0.5 text-xs text-paper">
                {nome}
                {id === meuId ? ' (você)' : ''}
            </span>

            {acoes.length > 0 && (
                <div className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                    {acoes.map((acao) => (
                        <button
                            key={acao.rotulo}
                            onClick={acao.onClick}
                            className={`rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm transition focus-visible:outline-2 focus-visible:outline-signal ${
                                acao.perigo ? 'text-live hover:bg-live hover:text-white' : 'text-paper hover:bg-ink-3'
                            }`}
                        >
                            {acao.rotulo}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
