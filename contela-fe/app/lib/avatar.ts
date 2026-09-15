const CORES = ['#f23f43', '#f0b232', '#23a55a', '#5865f2', '#eb459e', '#00a8fc', '#f47b67', '#949cf7'];

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
