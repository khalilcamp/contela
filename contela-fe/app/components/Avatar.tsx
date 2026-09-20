import { corAvatar } from '../lib/avatar';
import { Mascote } from './Mascote';

interface AvatarProps {
    id: string;
    nome?: string;
    tamanho?: number;
    compartilhando?: boolean;
}

export function Avatar({ id, tamanho = 40, compartilhando = false }: AvatarProps) {
    return (
        <div className="shrink-0" style={{ width: tamanho, height: tamanho }}>
            <Mascote
                acento={corAvatar(id)}
                estagioVisual={compartilhando ? 2 : 1}
                chapeu={compartilhando ? 'coroa' : 'nenhum'}
                flutuar={tamanho >= 40}
                className="h-full w-full"
            />
        </div>
    );
}
