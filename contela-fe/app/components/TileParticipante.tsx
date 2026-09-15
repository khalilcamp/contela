import { corAvatar } from '../lib/avatar';
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
            className="relative flex aspect-square h-full w-full items-center justify-center overflow-hidden rounded-xl border bg-[#101113]"
            style={{ borderColor: compartilhando ? corAvatar(id) : 'rgba(255,255,255,0.07)' }}
        >
            <Avatar id={id} nome={nome} tamanho={tamanhoAvatar} />
            <span className="absolute bottom-2 left-2 truncate rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                {nome}
                {id === meuId ? ' (você)' : ''}
            </span>
        </div>
    );
}
