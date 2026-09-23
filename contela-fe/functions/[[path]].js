// Cloudflare Pages Function: proxy reverso pro backend real, no mesmo dominio do front.
// So intercepta os caminhos do backend (wsock/api/saude) - o resto cai pro front estatico.
// BACKEND_ORIGIN e configurado como variavel de ambiente no projeto Cloudflare Pages
// (ex: https://seu-backend.onrender.com), nunca commitado aqui.

const PREFIXOS_BACKEND = ['/wsock', '/api', '/saude'];

function ehCaminhoDoBackend(pathname) {
    return PREFIXOS_BACKEND.some((prefixo) => pathname === prefixo || pathname.startsWith(`${prefixo}/`));
}

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    if (!ehCaminhoDoBackend(url.pathname)) {
        return next();
    }

    if (!env.BACKEND_ORIGIN) {
        return new Response('BACKEND_ORIGIN nao configurado no projeto Cloudflare Pages.', { status: 500 });
    }

    const destino = new URL(url.pathname + url.search, env.BACKEND_ORIGIN);
    const requisicaoProxiada = new Request(destino.toString(), request);
    return fetch(requisicaoProxiada);
}
