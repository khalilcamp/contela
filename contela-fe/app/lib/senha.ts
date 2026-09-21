const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function gerarSenha(tamanho = 12): string {
    const sorteio = new Uint32Array(tamanho);
    crypto.getRandomValues(sorteio);
    return Array.from(sorteio, (n) => ALFABETO[n % ALFABETO.length]).join('');
}
