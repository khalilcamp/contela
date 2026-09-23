export interface GifResultado {
    id: string;
    url: string;
    urlPreview: string;
    descricao: string;
}

export function giphyDisponivel(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_GIPHY_API_KEY);
}

interface RespostaGiphy {
    data: {
        id: string;
        title?: string;
        images: {
            fixed_height?: { url: string };
            fixed_height_small?: { url: string };
            preview_gif?: { url: string };
        };
    }[];
}

async function buscar(endpoint: string, params: Record<string, string>): Promise<GifResultado[]> {
    const chave = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
    if (!chave) return [];

    const url = new URL(`https://api.giphy.com/v1/gifs/${endpoint}`);
    url.searchParams.set('api_key', chave);
    url.searchParams.set('limit', '24');
    url.searchParams.set('rating', 'pg-13');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), 6000);
    try {
        const resposta = await fetch(url.toString(), { signal: controlador.signal });
        if (!resposta.ok) return [];
        const dados: RespostaGiphy = await resposta.json();
        return dados.data
            .filter((g) => g.images.fixed_height)
            .map((g) => ({
                id: g.id,
                url: g.images.fixed_height!.url,
                urlPreview: g.images.fixed_height_small?.url ?? g.images.preview_gif?.url ?? g.images.fixed_height!.url,
                descricao: g.title || 'GIF',
            }));
    } catch {
        return [];
    } finally {
        clearTimeout(limite);
    }
}

export function buscarGifsEmAlta(): Promise<GifResultado[]> {
    return buscar('trending', {});
}

export function buscarGifs(consulta: string): Promise<GifResultado[]> {
    if (!consulta.trim()) return buscarGifsEmAlta();
    return buscar('search', { q: consulta.trim() });
}
