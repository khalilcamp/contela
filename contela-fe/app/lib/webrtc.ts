import { Client } from '@stomp/stompjs';
import { enviarSinal } from './websocket';
import { SinalWebRTC } from '../types/sala';
import {
    OPCOES_PADRAO,
    OpcoesCompartilhamento,
    calcularBitrateMaximo,
    construirConstraintsVideo,
} from '../types/compartilhamento';

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export class GerenciadorWebRTC {
    private client: Client;
    private salaId: string;
    private meuId: string;
    private conexoes: Map<string, RTCPeerConnection> = new Map();
    private filaSinais: Promise<void> = Promise.resolve();
    private streamLocal: MediaStream | null = null;
    private opcoes: OpcoesCompartilhamento = OPCOES_PADRAO;

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

    async iniciarCompartilhamento(
        participantesIds: string[],
        opcoes: OpcoesCompartilhamento = OPCOES_PADRAO,
        fonteId: string | null = null
    ): Promise<MediaStream> {
        if (fonteId && window.contela) {
            await window.contela.selecionarFonte({ id: fonteId, audio: opcoes.audio });
        }

        this.opcoes = opcoes;
        this.streamLocal = await navigator.mediaDevices.getDisplayMedia({
            video: construirConstraintsVideo(opcoes),
            audio: opcoes.audio ? ({ systemAudio: 'include', windowAudio: 'window' } as MediaTrackConstraints) : false,
            selfBrowserSurface: 'exclude',
            surfaceSwitching: 'include',
            monitorTypeSurfaces: 'include',
        } as DisplayMediaStreamOptions);

        this.streamLocal.getVideoTracks().forEach((track) => {
            track.contentHint = opcoes.fps === 60 ? 'motion' : 'detail';
        });

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
            try {
                enviarSinal(this.client, this.salaId, {
                    tipo: 'compartilhamento-parado',
                    destinatarioId: peerId,
                    payload: null,
                });
            } catch {}
            conexao.close();
        });
        this.conexoes.clear();
    }

    processarSinalRecebido(sinal: SinalWebRTC): Promise<void> {
        this.filaSinais = this.filaSinais
            .then(() => this.tratarSinal(sinal))
            .catch((erro) => console.error('Erro ao processar sinal WebRTC:', sinal.tipo, erro));
        return this.filaSinais;
    }

    private async tratarSinal(sinal: SinalWebRTC) {
        if (sinal.tipo === 'compartilhamento-parado') {
            this.conexoes.get(sinal.remetenteId)?.close();
            this.conexoes.delete(sinal.remetenteId);
            this.onCompartilhamentoParado(sinal.remetenteId);
            return;
        }

        const conexao = this.obterOuCriarConexao(sinal.remetenteId);

        if (sinal.tipo === 'offer') {
            if (conexao.signalingState !== 'stable') return;
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
            if (conexao.signalingState !== 'have-local-offer') return;
            await conexao.setRemoteDescription(sinal.payload as RTCSessionDescriptionInit);
        }

        if (sinal.tipo === 'ice-candidate') {
            await conexao.addIceCandidate(sinal.payload as RTCIceCandidateInit);
        }
    }

    private async criarOfertaPara(peerId: string) {
        const conexao = this.obterOuCriarConexao(peerId);
        if (conexao.signalingState !== 'stable') return;

        this.streamLocal?.getTracks().forEach((track) => {
            conexao.addTrack(track, this.streamLocal!);
        });

        const offer = await conexao.createOffer();
        await conexao.setLocalDescription(offer);
        await this.limitarBitrate(conexao);

        enviarSinal(this.client, this.salaId, {
            tipo: 'offer',
            destinatarioId: peerId,
            payload: offer,
        });
    }

    private async limitarBitrate(conexao: RTCPeerConnection) {
        const maxBitrate = calcularBitrateMaximo(this.opcoes);
        for (const sender of conexao.getSenders()) {
            if (sender.track?.kind !== 'video') continue;
            try {
                const parametros = sender.getParameters();
                if (!parametros.encodings?.length) parametros.encodings = [{}];
                parametros.encodings[0].maxBitrate = maxBitrate;
                await sender.setParameters(parametros);
            } catch (erro) {
                console.warn('Nao foi possivel limitar o bitrate:', erro);
            }
        }
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