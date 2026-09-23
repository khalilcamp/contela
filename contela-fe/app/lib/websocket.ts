import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SalaResponse, MensagemResponse, SinalWebRTC, TipoMensagem } from '../types/sala';
import { SERVIDORES_ICE_PADRAO } from './ice';
import { VERSAO_APP, plataformaAtual } from './versao';

function obterWsUrl(): string {
    if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
    const { protocol, hostname } = window.location;
    const host = protocol.startsWith('http') ? hostname : 'localhost';
    return `http://${host}:8080/wsock`;
}

export function obterApiUrl(): string {
    return obterWsUrl().replace(/\/wsock$/, '');
}

export function normalizarSalaId(bruto: string): string {
    const limpo = bruto.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return limpo.length === 8 ? `${limpo.slice(0, 4)}-${limpo.slice(4)}` : limpo;
}

export interface SalaCriada {
    id: string;
    tokenDono: string;
}

export async function criarSala(senha: string): Promise<SalaCriada> {
    let resposta: Response;
    try {
        resposta = await fetch(`${obterApiUrl()}/api/salas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(senha ? { senha } : {}),
        });
    } catch {
        throw new Error('Não foi possível falar com o servidor.');
    }

    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
        throw new Error(dados?.mensagem ?? 'Não foi possível criar a sala.');
    }
    return dados as SalaCriada;
}

export async function buscarServidoresIce(): Promise<RTCIceServer[]> {
    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), 4000);
    try {
        const resposta = await fetch(`${obterApiUrl()}/api/ice`, { signal: controlador.signal });
        if (!resposta.ok) return SERVIDORES_ICE_PADRAO;
        const dados = await resposta.json();
        return Array.isArray(dados?.iceServers) && dados.iceServers.length > 0 ? dados.iceServers : SERVIDORES_ICE_PADRAO;
    } catch {
        return SERVIDORES_ICE_PADRAO;
    } finally {
        clearTimeout(limite);
    }
}

export function criarClienteStomp(): Client {
    return new Client({
        webSocketFactory: () => new SockJS(obterWsUrl()),
        reconnectDelay: 0,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
    });
}

export interface DadosEntrada {
    nome: string;
    senha: string;
    tokenDono: string | null;
    cor: string | null;
    chapeu: string | null;
}

export interface EventosSala {
    onConfirmacao: (confirmacao: { meuId: string; salaId: string }) => void;
    onParticipantes: (sala: SalaResponse) => void;
    onMensagem: (mensagem: MensagemResponse) => void;
    onSinal: (sinal: SinalWebRTC) => void;
    onErro: (mensagem: string) => void;
    onExpulso: (motivo: string) => void;
    onAviso: (aviso: AvisoVersao) => void;
}

export interface AvisoVersao {
    versao: string;
    url: string;
}

export function entrarNaSala(client: Client, salaId: string, dados: DadosEntrada, eventos: EventosSala) {
    client.subscribe('/user/queue/erro', (message) => eventos.onErro(message.body));
    client.subscribe('/user/queue/expulso', (message) => eventos.onExpulso(message.body));
    client.subscribe('/user/queue/sinal', (message) => eventos.onSinal(JSON.parse(message.body)));
    client.subscribe('/user/queue/aviso', (message) => eventos.onAviso(JSON.parse(message.body)));

    client.subscribe('/user/queue/confirmacao', (message) => {
        const confirmacao = JSON.parse(message.body);
        eventos.onConfirmacao(confirmacao);

        client.subscribe(`/topic/sala/${confirmacao.salaId}/participantes`, (m) => eventos.onParticipantes(JSON.parse(m.body)));
        client.subscribe(`/topic/sala/${confirmacao.salaId}/chat`, (m) => eventos.onMensagem(JSON.parse(m.body)));
        client.publish({ destination: `/app/sala/${confirmacao.salaId}/sincronizar`, body: '' });
    });

    setTimeout(() => {
        if (!client.connected) return;
        client.publish({
            destination: `/app/sala/${salaId}/entrar`,
            body: JSON.stringify({
                nome: dados.nome,
                senha: dados.senha || null,
                tokenDono: dados.tokenDono,
                versaoApp: VERSAO_APP,
                plataforma: plataformaAtual(),
                cor: dados.cor,
                chapeu: dados.chapeu,
            }),
        });
    }, 150);
}

export function enviarMensagem(client: Client, salaId: string, texto: string, tipo: TipoMensagem = 'TEXTO') {
    client.publish({
        destination: `/app/sala/${salaId}/chat`,
        body: JSON.stringify({ texto, tipo }),
    });
}

export function enviarStatusCompartilhamento(client: Client, salaId: string, compartilhando: boolean) {
    client.publish({
        destination: `/app/sala/${salaId}/compartilhar`,
        body: JSON.stringify(compartilhando),
    });
}

export function enviarSinal(
    client: Client,
    salaId: string,
    sinal: Omit<SinalWebRTC, 'remetenteId'>
) {
    client.publish({
        destination: `/app/sala/${salaId}/sinal`,
        body: JSON.stringify(sinal),
    });
}

export function pararCompartilhamentoDe(client: Client, salaId: string, alvoId: string) {
    client.publish({
        destination: `/app/sala/${salaId}/parar`,
        body: JSON.stringify({ alvoId }),
    });
}

export function expulsarParticipante(client: Client, salaId: string, alvoId: string) {
    client.publish({
        destination: `/app/sala/${salaId}/expulsar`,
        body: JSON.stringify({ alvoId }),
    });
}
