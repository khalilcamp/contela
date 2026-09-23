export interface SegmentoMencao {
    texto: string;
    mencao: boolean;
}

const LIMITE_PALAVRA = /[\p{L}\p{N}_]/u;

export function segmentarMencoes(texto: string, nomesConhecidos: string[]): SegmentoMencao[] {
    const nomes = [...new Set(nomesConhecidos.filter((n) => n.trim().length > 0))].sort((a, b) => b.length - a.length);
    if (!texto.includes('@') || nomes.length === 0) {
        return [{ texto, mencao: false }];
    }

    const segmentos: SegmentoMencao[] = [];
    let atual = '';
    let i = 0;

    while (i < texto.length) {
        if (texto[i] === '@') {
            const resto = texto.slice(i + 1);
            const restoLower = resto.toLowerCase();
            const nomeEncontrado = nomes.find((nome) => {
                if (!restoLower.startsWith(nome.toLowerCase())) return false;
                const proximo = resto[nome.length];
                return proximo === undefined || !LIMITE_PALAVRA.test(proximo);
            });

            if (nomeEncontrado) {
                if (atual) {
                    segmentos.push({ texto: atual, mencao: false });
                    atual = '';
                }
                segmentos.push({ texto: `@${resto.slice(0, nomeEncontrado.length)}`, mencao: true });
                i += 1 + nomeEncontrado.length;
                continue;
            }
        }
        atual += texto[i];
        i += 1;
    }

    if (atual) segmentos.push({ texto: atual, mencao: false });
    return segmentos;
}

export function mensagemMenciona(texto: string, nome: string | null | undefined): boolean {
    if (!nome || !nome.trim()) return false;
    return segmentarMencoes(texto, [nome]).some((s) => s.mencao);
}
