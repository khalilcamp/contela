import { Client } from '@stomp/stompjs';
import { enviarSinal } from './websocket';
import { SinalWebRTC } from '../types/sala';

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export class GerenciadorWebRTC {
    private client: Client;
    private salaId: string;
    private meuId: string;
    private conexoes: Map<string, RTCPeerConnection> = new Map();
    private streamLocal: MediaStream | null = null;

    private onStreamRemota: (peerId: string, stream: MediaStream) => void;
    private onCompartilhamentoParado: (peerId: string) => void;

    constructor(
        client: Client,
        salaId: string,
        meuId: string,
        onStreamRemota: (peerId: string, stream: MediaStream) => void,
        onCompartilhamentoParado: (peerId: string) => void
    ) {
        this.client = client;
        this.salaId = salaId;
        this.meuId = meuId;
        this.onStreamRemota = onStreamRemota;
        this.onCompartilhamentoParado = onCompartilhamentoParado;
    }

    async iniciarCompartilhamento(participantesIds: string[]): Promise<MediaStream> {
        this.streamLocal = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: 'browser' } as MediaTrackConstraints,
            audio: { systemAudio: 'include', windowAudio: 'window' } as MediaTrackConstraints,
            selfBrowserSurface: 'exclude',
            surfaceSwitching: 'include',
            monitorTypeSurfaces: 'include',
        } as DisplayMediaStreamOptions);

        for (const peerId of participantesIds) {
            if (peerId === this.meuId) continue;
            await this.criarOfertaPara(peerId);
        }

        return this.streamLocal;
    }

    async adicionarParticipante(peerId: string) {
        if (!this.streamLocal) return;
        if (peerId === this.meuId) return;
        if (this.conexoes.has(peerId)) return;

        await this.criarOfertaPara(peerId);
    }

    pararCompartilhamento() {
        this.streamLocal?.getTracks().forEach((track) => track.stop());
        this.streamLocal = null;

        this.conexoes.forEach((conexao, peerId) => {
            enviarSinal(this.client, this.salaId, {
                tipo: 'compartilhamento-parado',
                destinatarioId: peerId,
                payload: null,
            });
            conexao.close();
        });
        this.conexoes.clear();
    }

    async processarSinalRecebido(sinal: SinalWebRTC) {
        if (sinal.tipo === 'compartilhamento-parado') {
            this.conexoes.get(sinal.remetenteId)?.close();
            this.conexoes.delete(sinal.remetenteId);
            this.onCompartilhamentoParado(sinal.remetenteId);
            return;
        }

        const conexao = this.obterOuCriarConexao(sinal.remetenteId);

        if (sinal.tipo === 'offer') {
            await conexao.setRemoteDescription(sinal.payload as RTCSessionDescriptionInit);
            const answer = await conexao.createAnswer();
            await conexao.setLocalDescription(answer);

            enviarSinal(this.client, this.salaId, {
                tipo: 'answer',
                destinatarioId: sinal.remetenteId,
                payload: answer,
            });
        }

        if (sinal.tipo === 'answer') {
            await conexao.setRemoteDescription(sinal.payload as RTCSessionDescriptionInit);
        }

        if (sinal.tipo === 'ice-candidate') {
            await conexao.addIceCandidate(sinal.payload as RTCIceCandidateInit);
        }
    }

    private async criarOfertaPara(peerId: string) {
        const conexao = this.obterOuCriarConexao(peerId);

        this.streamLocal?.getTracks().forEach((track) => {
            conexao.addTrack(track, this.streamLocal!);
        });

        const offer = await conexao.createOffer();
        await conexao.setLocalDescription(offer);

        enviarSinal(this.client, this.salaId, {
            tipo: 'offer',
            destinatarioId: peerId,
            payload: offer,
        });
    }

    private obterOuCriarConexao(peerId: string): RTCPeerConnection {
        const existente = this.conexoes.get(peerId);
        if (existente) return existente;

        const conexao = new RTCPeerConnection(ICE_SERVERS);

        conexao.onicecandidate = (event) => {
            if (event.candidate) {
                enviarSinal(this.client, this.salaId, {
                    tipo: 'ice-candidate',
                    destinatarioId: peerId,
                    payload: event.candidate,
                });
            }
        };

        conexao.ontrack = (event) => {
            this.onStreamRemota(peerId, event.streams[0]);
        };

        this.conexoes.set(peerId, conexao);
        return conexao;
    }
}