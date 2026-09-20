import { Client } from '@stomp/stompjs';
import { enviarSinal } from './websocket';
import { SinalWebRTC } from '../types/sala';
import {
    OPCOES_PADRAO,
    OpcoesCompartilhamento,
    calcularBitrateMaximo,
    construirConstraintsVideo,
} from '../types/compartilhamento';

import { AudioJanela } from './audioJanela';
import { SERVIDORES_ICE_PADRAO } from './ice';

export class GerenciadorWebRTC {
    private client: Client;
    private salaId: string;
    private meuId: string;
    private servidoresIce: RTCIceServer[];
    private conexoes: Map<string, RTCPeerConnection> = new Map();
    private candidatosPendentes: Map<string, RTCIceCandidateInit[]> = new Map();
    private filaSinais: Promise<void> = Promise.resolve();
    private streamLocal: MediaStream | null = null;
    private opcoes: OpcoesCompartilhamento = OPCOES_PADRAO;
    private audioJanela: AudioJanela | null = null;
    audioDeJanelaFalhou = false;

    private onStreamRemota: (peerId: string, stream: MediaStream) => void;
    private onCompartilhamentoParado: (peerId: string) => void;

    constructor(
        client: Client,
        salaId: string,
        meuId: string,
        onStreamRemota: (peerId: string, stream: MediaStream) => void,
        onCompartilhamentoParado: (peerId: string) => void,
        servidoresIce: RTCIceServer[] = SERVIDORES_ICE_PADRAO
    ) {
        this.client = client;
        this.salaId = salaId;
        this.meuId = meuId;
        this.servidoresIce = servidoresIce;
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
        this.audioDeJanelaFalhou = false;
        const ehJanelaDoDesktop = Boolean(fonteId?.startsWith('window:') && window.contela);
        const audioDoSistema = opcoes.audio && !ehJanelaDoDesktop;

        this.streamLocal = await navigator.mediaDevices.getDisplayMedia({
            video: construirConstraintsVideo(opcoes),
            audio: audioDoSistema ? ({ systemAudio: 'include', windowAudio: 'window' } as MediaTrackConstraints) : false,
            selfBrowserSurface: 'exclude',
            surfaceSwitching: 'include',
            monitorTypeSurfaces: 'include',
        } as DisplayMediaStreamOptions);

        if (opcoes.audio && ehJanelaDoDesktop && fonteId) {
            this.audioJanela = await AudioJanela.criar(fonteId);
            if (this.audioJanela) this.streamLocal.addTrack(this.audioJanela.faixa);
            else this.audioDeJanelaFalhou = true;
        }

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
        this.audioJanela?.encerrar();
        this.audioJanela = null;

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
        this.candidatosPendentes.clear();
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
            this.candidatosPendentes.delete(sinal.remetenteId);
            this.onCompartilhamentoParado(sinal.remetenteId);
            return;
        }

        const conexao = this.obterOuCriarConexao(sinal.remetenteId);

        if (sinal.tipo === 'offer') {
            if (conexao.signalingState !== 'stable') return;
            await conexao.setRemoteDescription(sinal.payload as RTCSessionDescriptionInit);
            await this.aplicarCandidatosPendentes(sinal.remetenteId, conexao);
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
            await this.aplicarCandidatosPendentes(sinal.remetenteId, conexao);
        }

        if (sinal.tipo === 'ice-candidate') {
            const candidato = sinal.payload as RTCIceCandidateInit;
            if (!conexao.remoteDescription) {
                const fila = this.candidatosPendentes.get(sinal.remetenteId) ?? [];
                fila.push(candidato);
                this.candidatosPendentes.set(sinal.remetenteId, fila);
                return;
            }
            await conexao.addIceCandidate(candidato);
        }
    }

    private async aplicarCandidatosPendentes(peerId: string, conexao: RTCPeerConnection) {
        const fila = this.candidatosPendentes.get(peerId);
        if (!fila) return;
        this.candidatosPendentes.delete(peerId);
        for (const candidato of fila) {
            try {
                await conexao.addIceCandidate(candidato);
            } catch (erro) {
                console.warn('Candidato ICE ignorado:', erro);
            }
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

        const conexao = new RTCPeerConnection({ iceServers: this.servidoresIce });

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