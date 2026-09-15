import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SalaResponse, MensagemResponse, SinalWebRTC } from '../types/sala';

const WS_URL = 'http://localhost:8080/wsock';

export function criarClienteStomp(): Client {
    return new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
    });
}

export function entrarNaSala(
    client: Client,
    salaId: string,
    nome: string,
    onParticipantesAtualizados: (sala: SalaResponse) => void,
    onNovaMensagem: (mensagem: MensagemResponse) => void,
    onSinalRecebido: (sinal: SinalWebRTC) => void,
    onConfirmacaoEntrada: (meuId: string) => void
) {
    client.subscribe(`/topic/sala/${salaId}/participantes`, (message: IMessage) => {
        const sala: SalaResponse = JSON.parse(message.body);
        onParticipantesAtualizados(sala);
    });

    client.subscribe(`/topic/sala/${salaId}/chat`, (message: IMessage) => {
        const mensagem: MensagemResponse = JSON.parse(message.body);
        onNovaMensagem(mensagem);
    });

    client.subscribe(`/user/queue/sinal`, (message: IMessage) => {
        const sinal: SinalWebRTC = JSON.parse(message.body);
        onSinalRecebido(sinal);
    });

    client.subscribe(`/user/queue/confirmacao`, (message: IMessage) => {
        const confirmacao = JSON.parse(message.body);
        onConfirmacaoEntrada(confirmacao.meuId);
    });

    client.publish({
        destination: `/app/sala/${salaId}/entrar`,
        body: JSON.stringify({ nome }),
    });
}

export function enviarMensagem(client: Client, salaId: string, texto: string) {
    client.publish({
        destination: `/app/sala/${salaId}/chat`,
        body: JSON.stringify({ texto }),
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