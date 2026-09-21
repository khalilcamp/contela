export type Resolucao = '720p' | '1080p' | '1440p' | 'fonte';
export type TaxaQuadros = 15 | 30 | 60;

export interface OpcoesCompartilhamento {
    resolucao: Resolucao;
    fps: TaxaQuadros;
    audio: boolean;
    apenasAudio: boolean;
}

export const OPCOES_PADRAO: OpcoesCompartilhamento = {
    resolucao: '1080p',
    fps: 30,
    audio: true,
    apenasAudio: false,
};

export interface FonteCaptura {
    id: string;
    name: string;
    tipo: 'screen' | 'window';
    thumbnail: string;
    appIcon: string | null;
}

const ALTURAS: Record<Exclude<Resolucao, 'fonte'>, { largura: number; altura: number }> = {
    '720p': { largura: 1280, altura: 720 },
    '1080p': { largura: 1920, altura: 1080 },
    '1440p': { largura: 2560, altura: 1440 },
};

const BITRATE_BASE: Record<Resolucao, number> = {
    '720p': 2_500_000,
    '1080p': 5_000_000,
    '1440p': 8_000_000,
    fonte: 8_000_000,
};

export function construirConstraintsVideo(opcoes: OpcoesCompartilhamento): MediaTrackConstraints {
    const constraints: MediaTrackConstraints = { frameRate: { ideal: opcoes.fps, max: opcoes.fps } };
    if (opcoes.resolucao !== 'fonte') {
        const { largura, altura } = ALTURAS[opcoes.resolucao];
        constraints.width = { ideal: largura };
        constraints.height = { ideal: altura };
    }
    return constraints;
}

export function resumirOpcoes(opcoes: OpcoesCompartilhamento): string {
    if (opcoes.apenasAudio) return 'Só áudio, estéreo, até 128 kbps';
    const rotulo = opcoes.resolucao === 'fonte' ? 'Original' : opcoes.resolucao;
    const mbps = (calcularBitrateMaximo(opcoes) / 1_000_000).toFixed(1).replace('.', ',');
    return `${rotulo} a ${opcoes.fps} fps, até ${mbps} Mbps`;
}

export function calcularBitrateMaximo(opcoes: OpcoesCompartilhamento): number {
    const fator = opcoes.fps === 60 ? 1.6 : opcoes.fps === 15 ? 0.6 : 1;
    return Math.round(BITRATE_BASE[opcoes.resolucao] * fator);
}
