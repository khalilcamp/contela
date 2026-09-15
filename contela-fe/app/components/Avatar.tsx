import { corAvatar, iniciais } from '../lib/avatar';

interface AvatarProps {
    id: string;
    nome: string;
    tamanho?: number;
}

export function Avatar({ id, nome, tamanho = 40 }: AvatarProps) {
    return (
        <div
            className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
            style={{ width: tamanho, height: tamanho, backgroundColor: corAvatar(id), fontSize: tamanho * 0.4 }}
        >
            {iniciais(nome)}
        </div>
    );
}
