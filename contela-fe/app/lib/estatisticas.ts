import { obterApiUrl } from './websocket';

export async function buscarPessoasOnline(): Promise<number | null> {
    try {
        const resposta = await fetch(`${obterApiUrl()}/api/salas`);
        if (!resposta.ok) return null;
        const dados = await resposta.json();
        return typeof dados?.pessoasOnline === 'number' ? dados.pessoasOnline : null;
    } catch {
        return null;
    }
}
