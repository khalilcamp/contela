const ID_VALIDO = /^[A-Za-z0-9-]{1,16}$/;

export function salaIdValido(salaId: string): boolean {
    return ID_VALIDO.test(salaId);
}

export function linkDoApp(salaId: string): string {
    return `contela://sala/${encodeURIComponent(salaId)}`;
}

function baseWeb(): string | null {
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) return window.location.origin;
    const configurada = process.env.NEXT_PUBLIC_WEB_URL?.trim().replace(/\/+$/, '');
    return configurada || null;
}

export function linkWeb(salaId: string): string | null {
    const base = baseWeb();
    return base ? `${base}/?sala=${encodeURIComponent(salaId)}` : null;
}

export function melhorLink(salaId: string): string {
    return linkWeb(salaId) ?? linkDoApp(salaId);
}

export function textoDoConvite(salaId: string, senha?: string): string {
    const linhas = ['Entre na minha sala no Contela:'];
    const web = linkWeb(salaId);
    if (web) linhas.push(`Link: ${web}`);
    linhas.push(`Abrir no app: ${linkDoApp(salaId)}`);
    linhas.push(`Código: ${salaId}`);
    if (senha) linhas.push(`Senha: ${senha}`);
    return linhas.join('\n');
}
