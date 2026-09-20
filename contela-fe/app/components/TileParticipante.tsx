import { Avatar } from './Avatar';

interface TileParticipanteProps {
    id: string;
    nome: string;
    meuId: string | null;
    compartilhando?: boolean;
    tamanhoAvatar?: number;
}

export function TileParticipante({ id, nome, meuId, compartilhando, tamanhoAvatar = 56 }: TileParticipanteProps) {
    return (
        <div
            className={`flex aspect-square h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border bg-ink-2 p-2 ${
                compartilhando ? 'border-signal' : 'border-line'
            }`}
        >
            <Avatar id={id} nome={nome} tamanho={tamanhoAvatar} compartilhando={compartilhando} />
            <span className="max-w-full truncate rounded-md bg-black/40 px-2 py-0.5 text-xs text-paper">
                {nome}
                {id === meuId ? ' (você)' : ''}
            </span>
        </div>
    );
}
