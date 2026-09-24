/**
 * Reencaminha um MediaStreamTrack de video atraves de um <canvas> escondido,
 * desenhando quadros numa cadencia fixa e propria (via requestAnimationFrame +
 * requestFrame() manual no CanvasCaptureMediaStreamTrack).
 *
 * Existe pra contornar o "Auto-Throttled Screen Capture and Mirroring" do
 * Chromium (https://www.chromium.org/developers/design-documents/auto-throttled-screen-capture-and-mirroring/),
 * que reduz agressivamente a resolucao/taxa de entrega da captura nativa de
 * tela/janela/aba pra conteudo "animado" (video, jogos), sem nenhuma API
 * publica pra desativar. canvas.captureStream() e um caminho de codigo
 * completamente separado da captura nativa, entao nao passa por esse throttle.
 */

interface FaixaComRequestFrame extends MediaStreamTrack {
    requestFrame?: () => void;
}

export class RepasseCanvas {
    private readonly video: HTMLVideoElement;
    private readonly canvas: HTMLCanvasElement;
    private readonly contexto: CanvasRenderingContext2D;
    private readonly streamSaida: MediaStream;
    private rafId: number | null = null;
    private ativo = true;

    constructor(trackOriginal: MediaStreamTrack, fps: number) {
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
        const intervaloMs = 1000 / fps;
        let ultimo = 0;

        const loop = (agora: number) => {
            if (!this.ativo) return;
            if (agora - ultimo >= intervaloMs) {
                ultimo = agora;
                this.desenharQuadro();
            }
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    private desenharQuadro() {
        const largura = this.video.videoWidth;
        const altura = this.video.videoHeight;
        if (!largura || !altura) return;

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
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.streamSaida.getTracks().forEach((track) => track.stop());
        this.video.pause();
        this.video.srcObject = null;
    }
}
