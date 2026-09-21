import { obterApiUrl } from './websocket';

export type EstadoServidor = 'verificando' | 'acordando' | 'pronto' | 'fora';

const LIMITE_TOTAL_MS = 120_000;
const LIMITE_TENTATIVA_MS = 15_000;
const PAUSA_ENTRE_TENTATIVAS_MS = 2_000;
const DEMORA_PARA_AVISAR_MS = 2_500;
const FALHAS_DE_REDE_PARA_DESISTIR = 3;
const VALIDADE_DO_PRONTO_MS = 5 * 60_000;

let estado: EstadoServidor = 'verificando';
let aquecimento: Promise<boolean> | null = null;
let prontoAte = 0;
const ouvintes = new Set<(estado: EstadoServidor) => void>();

function definir(novo: EstadoServidor) {
    estado = novo;
    ouvintes.forEach((ouvinte) => ouvinte(novo));
}

export function estadoDoServidor(): EstadoServidor {
    return estado;
}

export function observarServidor(ouvinte: (estado: EstadoServidor) => void): () => void {
    ouvintes.add(ouvinte);
    return () => ouvintes.delete(ouvinte);
}

const pausar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function responde(sinal: AbortSignal): Promise<boolean> {
    try {
        await fetch(`${obterApiUrl()}/saude`, { mode: 'no-cors', cache: 'no-store', signal: sinal });
        return true;
    } catch {
        return false;
    }
}

async function sondar(): Promise<boolean> {
    const inicio = Date.now();
    definir('verificando');
    const aviso = setTimeout(() => {
        if (estado === 'verificando') definir('acordando');
    }, DEMORA_PARA_AVISAR_MS);

    let falhasDeRede = 0;
    try {
        while (Date.now() - inicio < LIMITE_TOTAL_MS) {
            const controle = new AbortController();
            const limite = setTimeout(() => controle.abort(), LIMITE_TENTATIVA_MS);
            try {
                const resposta = await fetch(`${obterApiUrl()}/saude`, { cache: 'no-store', signal: controle.signal });
                if (resposta.ok) {
                    prontoAte = Date.now() + VALIDADE_DO_PRONTO_MS;
                    definir('pronto');
                    return true;
                }
                falhasDeRede = 0;
            } catch (erro) {
                const alcancavel = erro instanceof TypeError ? await responde(controle.signal) : true;
                if (alcancavel) {
                    falhasDeRede = 0;
                } else if (++falhasDeRede >= FALHAS_DE_REDE_PARA_DESISTIR) {
                    definir('fora');
                    return false;
                }
            } finally {
                clearTimeout(limite);
            }
            await pausar(PAUSA_ENTRE_TENTATIVAS_MS);
        }
        definir('fora');
        return false;
    } finally {
        clearTimeout(aviso);
    }
}

export function garantirServidor(): Promise<boolean> {
    if (aquecimento && (estado !== 'pronto' || Date.now() < prontoAte)) return aquecimento;
    const tentativa = sondar();
    aquecimento = tentativa;
    tentativa.then((ok) => {
        if (!ok && aquecimento === tentativa) aquecimento = null;
    });
    return tentativa;
}
