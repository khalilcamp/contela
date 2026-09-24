/**
 * Reencaminha um MediaStreamTrack de video atraves de um <canvas> escondido,
 * desenhando quadros numa cadencia fixa e propria (via setInterval +
 * requestFrame() manual no CanvasCaptureMediaStreamTrack).
 *
 * Existe pra contornar o "Auto-Throttled Screen Capture and Mirroring" do
 * Chromium (https://www.chromium.org/developers/design-documents/auto-throttled-screen-capture-and-mirroring/),
 * que reduz agressivamente a resolucao/taxa de entrega da captura nativa de
 * tela/janela/aba pra conteudo "animado" (video, jogos), sem nenhuma API
 * publica pra desativar. canvas.captureStream() e um caminho de codigo
 * completamente separado da captura nativa, entao nao passa por esse throttle.
 *
 * Usa setInterval em vez de requestAnimationFrame de proposito: o rAF pausa
 * sozinho quando a aba fica em segundo plano (e o compartilhamento precisa
 * continuar rodando mesmo quando a pessoa troca de janela pra ver o que esta
 * compartilhando).
 */

interface FaixaComRequestFrame extends MediaStreamTrack {
    requestFrame?: () => void;
}

export class RepasseCanvas {
    private readonly video: HTMLVideoElement;
    private readonly canvas: HTMLCanvasElement;
    private readonly contexto: CanvasRenderingContext2D;
    private readonly streamSaida: MediaStream;
    private intervaloId: ReturnType<typeof setInterval> | null = null;
    private ativo = true;

    constructor(
        trackOriginal: MediaStreamTrack,
        fps: number,
        private readonly larguraMaxima: number | null = null,
        private readonly alturaMaxima: number | null = null
    ) {
        this.video = document.createElement('video');
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.srcObject = new MediaStream([trackOriginal]);
        void this.video.play().catch(() => {});

        this.canvas = document.createElement('canvas');
        const contexto = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
        if (!contexto) throw new Error('Nao foi possivel criar o contexto do canvas de repasse.');
        this.contexto = contexto;

        this.streamSaida = this.canvas.captureStream(0);
        this.iniciarLoop(fps);
    }

    private iniciarLoop(fps: number) {
        this.intervaloId = setInterval(() => {
            if (!this.ativo) return;
            this.desenharQuadro();
        }, 1000 / fps);
    }

    private desenharQuadro() {
        const larguraNativa = this.video.videoWidth;
        const alturaNativa = this.video.videoHeight;
        if (!larguraNativa || !alturaNativa) return;

        const fator = Math.min(
            1,
            this.larguraMaxima ? this.larguraMaxima / larguraNativa : 1,
            this.alturaMaxima ? this.alturaMaxima / alturaNativa : 1
        );
        const largura = Math.round(larguraNativa * fator);
        const altura = Math.round(alturaNativa * fator);

        if (this.canvas.width !== largura || this.canvas.height !== altura) {
            this.canvas.width = largura;
            this.canvas.height = altura;
        }

        this.contexto.drawImage(this.video, 0, 0, largura, altura);

        const faixa = this.streamSaida.getVideoTracks()[0] as FaixaComRequestFrame | undefined;
        faixa?.requestFrame?.();
    }

    get faixa(): MediaStreamTrack {
        return this.streamSaida.getVideoTracks()[0];
    }

    encerrar() {
        if (!this.ativo) return;
        this.ativo = false;
        if (this.intervaloId !== null) clearInterval(this.intervaloId);
        this.streamSaida.getTracks().forEach((track) => track.stop());
        this.video.pause();
        this.video.srcObject = null;
    }
}
