const API_RELEASE_MAIS_RECENTE = 'https://api.github.com/repos/khalilcamp/contela/releases/latest';
const PAGINA_RELEASES = 'https://github.com/khalilcamp/contela/releases/latest';

export interface DownloadsRelease {
    versao: string | null;
    portatilUrl: string | null;
    setupUrl: string | null;
    paginaUrl: string;
}

interface AssetGithub {
    name: string;
    browser_download_url: string;
}

export async function buscarUltimaRelease(): Promise<DownloadsRelease> {
    const vazio: DownloadsRelease = { versao: null, portatilUrl: null, setupUrl: null, paginaUrl: PAGINA_RELEASES };
    try {
        const controlador = new AbortController();
        const limite = setTimeout(() => controlador.abort(), 5000);
        let resposta: Response;
        try {
            resposta = await fetch(API_RELEASE_MAIS_RECENTE, { signal: controlador.signal });
        } finally {
            clearTimeout(limite);
        }
        if (!resposta.ok) return vazio;

        const dados = await resposta.json();
        const assets: AssetGithub[] = Array.isArray(dados?.assets) ? dados.assets : [];
        const portatil = assets.find((a) => a.name.toLowerCase().includes('portatil') && a.name.toLowerCase().endsWith('.exe'));
        const setup = assets.find((a) => a.name.toLowerCase().includes('setup') && a.name.toLowerCase().endsWith('.exe'));

        return {
            versao: typeof dados?.tag_name === 'string' ? dados.tag_name : null,
            portatilUrl: portatil?.browser_download_url ?? null,
            setupUrl: setup?.browser_download_url ?? null,
            paginaUrl: PAGINA_RELEASES,
        };
    } catch {
        return vazio;
    }
}
