import type { ChapeuEscolha } from '../types/sala';

const CORES = ['#f97316', '#3b82f6', '#22c55e', '#ec4899', '#a855f7', '#2dd4bf'];

export const CORES_ESCOLHA = CORES;

export const CHAPEUS_ESCOLHA: { valor: ChapeuEscolha; rotulo: string }[] = [
    { valor: 'nenhum', rotulo: 'Nenhum'},
    { valor: 'festa', rotulo: 'Festa'},
    { valor: 'bone', rotulo: 'Boné'},
];

export function corAvatar(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CORES[Math.abs(hash) % CORES.length];
}

export function iniciais(nome: string): string {
    return nome.trim().slice(0, 2).toUpperCase();
}
