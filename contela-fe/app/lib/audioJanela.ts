const CODIGO_WORKLET = `
class FilaPcm extends AudioWorkletProcessor {
    constructor() {
        super();
        this.fila = [];
        this.posicao = 0;
        this.quadros = 0;
        this.limite = 24000;
        this.port.onmessage = (evento) => {
            this.fila.push(evento.data);
            this.quadros += evento.data.length / 2;
            while (this.quadros > this.limite && this.fila.length > 1) {
                const descartado = this.fila.shift();
                this.quadros -= (descartado.length - this.posicao) / 2;
                this.posicao = 0;
            }
        };
    }

    process(_entradas, saidas) {
        const saida = saidas[0];
        const esquerda = saida[0];
        const direita = saida[1] || saida[0];
        for (let i = 0; i < esquerda.length; i++) {
            if (this.fila.length === 0) {
                esquerda[i] = 0;
                direita[i] = 0;
                continue;
            }
            const bloco = this.fila[0];
            esquerda[i] = bloco[this.posicao];
            direita[i] = bloco[this.posicao + 1];
            this.posicao += 2;
            this.quadros -= 1;
            if (this.posicao >= bloco.length) {
                this.fila.shift();
                this.posicao = 0;
            }
        }
        return true;
    }
}
registerProcessor('fila-pcm', FilaPcm);
`;

const BYTES_POR_QUADRO = 4;

export class AudioJanela {
    private contexto: AudioContext;
    private no: AudioWorkletNode;
    private destino: MediaStreamAudioDestinationNode;
    private cancelarEscuta: () => void;
    private resto: Uint8Array = new Uint8Array(0);

    private constructor(
        contexto: AudioContext,
        no: AudioWorkletNode,
        destino: MediaStreamAudioDestinationNode,
        cancelarEscuta: () => void
    ) {
        this.contexto = contexto;
        this.no = no;
        this.destino = destino;
        this.cancelarEscuta = cancelarEscuta;
    }

    get faixa(): MediaStreamTrack {
        return this.destino.stream.getAudioTracks()[0];
    }

    static async criar(fonteId: string): Promise<AudioJanela | null> {
        const desktop = window.contela;
        if (!desktop?.audioPorJanela) return null;

        const formato = await desktop.iniciarAudioJanela(fonteId);
        if (!formato) return null;

        try {
            const contexto = new AudioContext({ sampleRate: formato.sampleRate });
            const url = URL.createObjectURL(new Blob([CODIGO_WORKLET], { type: 'application/javascript' }));
            await contexto.audioWorklet.addModule(url);
            URL.revokeObjectURL(url);

            const no = new AudioWorkletNode(contexto, 'fila-pcm', { numberOfInputs: 0, outputChannelCount: [2] });
            const destino = contexto.createMediaStreamDestination();
            no.connect(destino);
            await contexto.resume();

            let instancia: AudioJanela | null = null;
            const cancelarEscuta = desktop.aoReceberAudio((pedaco) => instancia?.receber(pedaco));
            instancia = new AudioJanela(contexto, no, destino, cancelarEscuta);
            return instancia;
        } catch (erro) {
            console.warn('Nao foi possivel preparar o audio da janela:', erro);
            await desktop.pararAudioJanela();
            return null;
        }
    }

    private receber(pedaco: Uint8Array) {
        const juntos = new Uint8Array(this.resto.length + pedaco.length);
        juntos.set(this.resto, 0);
        juntos.set(pedaco, this.resto.length);

        const utilizavel = juntos.length - (juntos.length % BYTES_POR_QUADRO);
        this.resto = juntos.slice(utilizavel);
        if (utilizavel === 0) return;

        const inteiros = new Int16Array(juntos.buffer, juntos.byteOffset, utilizavel / 2);
        const decimais = new Float32Array(inteiros.length);
        for (let i = 0; i < inteiros.length; i++) decimais[i] = inteiros[i] / 32768;
        this.no.port.postMessage(decimais, [decimais.buffer]);
    }

    encerrar() {
        this.cancelarEscuta();
        window.contela?.pararAudioJanela();
        this.faixa.stop();
        void this.contexto.close();
    }
}
