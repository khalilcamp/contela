import { corAvatar } from '../lib/avatar';
import type { ChapeuEscolha } from '../types/sala';
import { Mascote } from './Mascote';

interface AvatarProps {
    id: string;
    nome?: string;
    tamanho?: number;
    compartilhando?: boolean;
    cor?: string | null;
    chapeu?: ChapeuEscolha | null;
}

export function Avatar({ id, tamanho = 40, compartilhando = false, cor, chapeu }: AvatarProps) {
    return (
        <div className="shrink-0" style={{ width: tamanho, height: tamanho }}>
            <Mascote
                acento={cor || corAvatar(id)}
                estagioVisual={compartilhando ? 2 : 1}
                chapeu={compartilhando ? 'coroa' : (chapeu ?? 'nenhum')}
                flutuar={tamanho >= 40}
                className="h-full w-full"
            />
        </div>
    );
}
