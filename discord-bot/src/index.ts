interface Env {
    DISCORD_PUBLIC_KEY: string;
    CONTELA_API: string;
    CONTELA_WEB: string;
    ALLOWED_GUILD_IDS?: string;
}

interface OpcaoComando {
    name: string;
    type: number;
    value?: string | boolean;
}

interface Interacao {
    type: number;
    application_id: string;
    token: string;
    guild_id?: string;
    data?: {
        name: string;
        options?: OpcaoComando[];
    };
}

const API_DISCORD = 'https://discord.com/api/v10';
const FLAG_EFEMERO = 64;
const COMANDOS = new Set(['contela', 'startscreenshare']);

function hexParaBytes(hex: string): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function respostaJson(corpo: unknown, status = 200): Response {
    return new Response(JSON.stringify(corpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function efemero(conteudo: string): Response {
    return respostaJson({ type: 4, data: { content: conteudo, flags: FLAG_EFEMERO } });
}

async function assinaturaValida(request: Request, corpo: string, env: Env): Promise<boolean> {
    const assinatura = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    if (!assinatura || !timestamp) return false;

    const chave = await crypto.subtle.importKey(
        'raw',
        hexParaBytes(env.DISCORD_PUBLIC_KEY),
        { name: 'Ed25519' },
        false,
        ['verify'],
    );

    return crypto.subtle.verify(
        'Ed25519',
        chave,
        hexParaBytes(assinatura),
        new TextEncoder().encode(timestamp + corpo),
    );
}

async function criarSala(env: Env, senha?: string): Promise<{ id: string; tokenDono: string }> {
    const resposta = await fetch(`${env.CONTELA_API.replace(/\/+$/, '')}/api/salas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(senha ? { senha } : {}),
        signal: AbortSignal.timeout(2500),
    });

    if (!resposta.ok) throw new Error(`backend respondeu ${resposta.status}`);
    return resposta.json();
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const corpo = await request.text();
        if (!(await assinaturaValida(request, corpo, env))) {
            return new Response('invalid request signature', { status: 401 });
        }

        const interacao = JSON.parse(corpo) as Interacao;

        if (interacao.type === 1) return respostaJson({ type: 1 });
        if (interacao.type !== 2) return efemero('Interação não suportada.');

        const permitidos = (env.ALLOWED_GUILD_IDS ?? '')
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
        if (permitidos.length > 0 && !permitidos.includes(interacao.guild_id ?? '')) {
            return efemero('Este servidor não está autorizado a usar o Contela.');
        }

        if (!interacao.data || !COMANDOS.has(interacao.data.name)) {
            return efemero('Comando desconhecido.');
        }

        const valorSenha = interacao.data.options?.find((o) => o.name === 'senha')?.value;
        const senha = typeof valorSenha === 'string' ? valorSenha : undefined;

        try {
            const sala = await criarSala(env, senha);
            const base = env.CONTELA_WEB.replace(/\/+$/, '');
            const link = `${base}/?sala=${encodeURIComponent(sala.id)}`;
            const linkAnfitriao = `${link}&dono=${encodeURIComponent(sala.tokenDono)}`;

            const linhas = [`Sala do Contela: **${sala.id}**`, link];
            if (senha) linhas.push(`Senha: ||${senha}||`);

            ctx.waitUntil(
                fetch(`${API_DISCORD}/webhooks/${interacao.application_id}/${interacao.token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `Você é o anfitrião. Guarde este link só pra você:\n${linkAnfitriao}`,
                        flags: FLAG_EFEMERO,
                    }),
                }).catch(() => undefined),
            );

            return respostaJson({ type: 4, data: { content: linhas.join('\n') } });
        } catch {
            return efemero('Não consegui falar com o servidor do Contela agora. Tente de novo em instantes.');
        }
    },
};
