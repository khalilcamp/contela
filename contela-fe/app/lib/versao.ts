export const VERSAO_APP = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

export function plataformaAtual(): 'desktop' | 'web' {
    return typeof window !== 'undefined' && window.contela ? 'desktop' : 'web';
}
