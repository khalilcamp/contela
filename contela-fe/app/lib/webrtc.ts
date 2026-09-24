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
import { forcarBitrateInicial } from './bitrateInicial';
import { DiagnosticoPeer } from './diagnostico';
import { SERVIDORES_ICE_PADRAO } from './ice';
import { pedirOpusEstereo, sdpTemOpusEstereo } from './opus';

export const ERRO_SEM_AUDIO = 'SEM_AUDIO';

type Estatistica = Record<string, unknown>;

const numero = (valor: unknown): number | null =>
    typeof valor === 'number' && Number.isFinite(valor) ? valor : null;

const texto = (valor: unknown): string | null => (typeof valor === 'string' ? valor : null);

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
    private transmitindo = false;
    private ultimasLeituras: Map<string, { instante: number; recebidos: number; enviados: number }> = new Map();
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

    async capturar(opcoes: OpcoesCompartilhamento = OPCOES_PADRAO, fonteId: string | null = null): Promise<MediaStream> {
        this.descartarCaptura();

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

        if (opcoes.apenasAudio && this.streamLocal.getAudioTracks().length === 0) {
            this.streamLocal.getTracks().forEach((track) => track.stop());
            this.audioJanela?.encerrar();
            this.audioJanela = null;
            this.streamLocal = null;
            throw new Error(ERRO_SEM_AUDIO);
        }

        this.streamLocal.getVideoTracks().forEach((track) => {
            track.contentHint = 'motion';
        });
        if (opcoes.apenasAudio) {
            this.streamLocal.getAudioTracks().forEach((track) => {
                track.contentHint = 'music';
            });
        }

        return this.streamLocal;
    }

    async iniciarTransmissao(participantesIds: string[]) {
        if (!this.streamLocal) throw new Error('Nada capturado para transmitir.');
        this.transmitindo = true;
        for (const peerId of participantesIds) {
            if (peerId === this.meuId) continue;
            await this.criarOfertaPara(peerId);
        }
    }

    descartarCaptura() {
        if (this.transmitindo) return;
        this.streamLocal?.getTracks().forEach((track) => track.stop());
        this.streamLocal = null;
        this.audioJanela?.encerrar();
        this.audioJanela = null;
    }

    get capturaPronta(): boolean {
        return this.streamLocal !== null;
    }

    async adicionarParticipante(peerId: string) {
        if (!this.transmitindo || !this.streamLocal) return;
        if (peerId === this.meuId) return;
        if (this.conexoes.has(peerId)) return;

        await this.criarOfertaPara(peerId);
    }

    pararCompartilhamento() {
        this.transmitindo = false;
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
        this.ultimasLeituras.clear();
    }

    tiposServidoresIce(): string[] {
        const tipos = new Set<string>();
        this.servidoresIce.forEach((servidor) => {
            [servidor.urls].flat().forEach((url) => {
                const esquema = url.split(':')[0];
                if (esquema === 'stun' || esquema === 'stuns') tipos.add('STUN');
                if (esquema === 'turn' || esquema === 'turns') tipos.add('TURN');
            });
        });
        return [...tipos];
    }

    async coletarDiagnostico(): Promise<DiagnosticoPeer[]> {
        const instante = performance.now();
        const resultado: DiagnosticoPeer[] = [];

        for (const [peerId, conexao] of this.conexoes) {
            let relatorio: RTCStatsReport;
            try {
                relatorio = await conexao.getStats();
            } catch {
                continue;
            }

            const itens = new Map<string, Estatistica>();
            relatorio.forEach((item) => itens.set(item.id, item as unknown as Estatistica));

            let idDoPar: string | null = null;
            let entrada: Estatistica | null = null;
            let saida: Estatistica | null = null;
            let parEscolhido: Estatistica | null = null;

            itens.forEach((item) => {
                if (item.type === 'transport') idDoPar = texto(item.selectedCandidatePairId) ?? idDoPar;
                if (item.type === 'inbound-rtp' && (item.kind === 'video' || (item.kind === 'audio' && !entrada))) entrada = item;
                if (item.type === 'outbound-rtp' && (item.kind === 'video' || (item.kind === 'audio' && !saida))) saida = item;
            });

            if (idDoPar) parEscolhido = itens.get(idDoPar) ?? null;
            if (!parEscolhido) {
                itens.forEach((item) => {
                    if (item.type === 'candidate-pair' && item.state === 'succeeded' && (item.nominated || !parEscolhido)) {
                        parEscolhido = item;
                    }
                });
            }

            const par = parEscolhido as Estatistica | null;
            const local = par ? itens.get(texto(par.localCandidateId) ?? '') : undefined;
            const remoto = par ? itens.get(texto(par.remoteCandidateId) ?? '') : undefined;
            const tipoLocal = local ? texto(local.candidateType) : null;
            const tipoRemoto = remoto ? texto(remoto.candidateType) : null;

            const recebidos = numero((entrada as Estatistica | null)?.bytesReceived) ?? 0;
            const enviados = numero((saida as Estatistica | null)?.bytesSent) ?? 0;
            const anterior = this.ultimasLeituras.get(peerId);
            let kbpsRecebendo: number | null = null;
            let kbpsEnviando: number | null = null;
            if (anterior && instante > anterior.instante) {
                const segundos = (instante - anterior.instante) / 1000;
                kbpsRecebendo = ((recebidos - anterior.recebidos) * 8) / 1000 / segundos;
                kbpsEnviando = ((enviados - anterior.enviados) * 8) / 1000 / segundos;
            }
            this.ultimasLeituras.set(peerId, { instante, recebidos, enviados });

            const videoEntrada = entrada as Estatistica | null;
            const videoSaida = saida as Estatistica | null;
            const perdidos = numero(videoEntrada?.packetsLost);
            const recebidosPacotes = numero(videoEntrada?.packetsReceived);
            const rtt = numero(par?.currentRoundTripTime);

            resultado.push({
                peerId,
                estadoIce: conexao.iceConnectionState,
                estadoConexao: conexao.connectionState,
                via: !par ? 'indefinida' : tipoLocal === 'relay' || tipoRemoto === 'relay' ? 'retransmissao' : 'direta',
                tipoLocal,
                tipoRemoto,
                protocolo: local ? texto(local.protocol) : null,
                rttMs: rtt === null ? null : rtt * 1000,
                kbpsRecebendo: videoEntrada ? kbpsRecebendo : null,
                kbpsEnviando: videoSaida ? kbpsEnviando : null,
                fps: numero(videoEntrada?.framesPerSecond) ?? numero(videoSaida?.framesPerSecond),
                largura: numero(videoEntrada?.frameWidth) ?? numero(videoSaida?.frameWidth),
                altura: numero(videoEntrada?.frameHeight) ?? numero(videoSaida?.frameHeight),
                perdaPct:
                    perdidos !== null && recebidosPacotes !== null && perdidos + recebidosPacotes > 0
                        ? (perdidos / (perdidos + recebidosPacotes)) * 100
                        : null,
                limitacao: texto(videoSaida?.qualityLimitationReason),
            });
        }

        return resultado;
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
            if (sdpTemOpusEstereo((sinal.payload as RTCSessionDescriptionInit).sdp)) answer.sdp = pedirOpusEstereo(answer.sdp);
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

        const faixas = this.opcoes.apenasAudio ? this.streamLocal?.getAudioTracks() : this.streamLocal?.getTracks();
        faixas?.forEach((track) => {
            conexao.addTrack(track, this.streamLocal!);
        });

        if (!this.opcoes.apenasAudio) this.preferirH264(conexao);

        const offer = await conexao.createOffer();
        if (this.opcoes.apenasAudio) offer.sdp = pedirOpusEstereo(offer.sdp);
        else offer.sdp = forcarBitrateInicial(offer.sdp, calcularBitrateMaximo(this.opcoes));
        await conexao.setLocalDescription(offer);
        await this.limitarBitrate(conexao);

        enviarSinal(this.client, this.salaId, {
            tipo: 'offer',
            destinatarioId: peerId,
            payload: offer,
        });
    }

    private preferirH264(conexao: RTCPeerConnection) {
        if (typeof RTCRtpSender.getCapabilities !== 'function') return;
        const capacidades = RTCRtpSender.getCapabilities('video');
        if (!capacidades) return;

        const h264 = capacidades.codecs.filter((codec) => codec.mimeType.toLowerCase() === 'video/h264');
        if (h264.length === 0) return;
        const outros = capacidades.codecs.filter((codec) => codec.mimeType.toLowerCase() !== 'video/h264');

        const transceptor = conexao.getTransceivers().find((t) => t.sender.track?.kind === 'video');
        if (!transceptor || typeof transceptor.setCodecPreferences !== 'function') return;
        try {
            transceptor.setCodecPreferences([...h264, ...outros]);
        } catch (erro) {
            console.warn('Nao foi possivel preferir H264:', erro);
        }
    }

    private async limitarBitrate(conexao: RTCPeerConnection) {
        const maxBitrate = calcularBitrateMaximo(this.opcoes);
        for (const sender of conexao.getSenders()) {
            if (sender.track?.kind !== 'video') continue;
            try {
                const parametros = sender.getParameters();
                if (!parametros.encodings?.length) parametros.encodings = [{}];
                parametros.encodings[0].maxBitrate = maxBitrate;
                parametros.degradationPreference = 'maintain-framerate';
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