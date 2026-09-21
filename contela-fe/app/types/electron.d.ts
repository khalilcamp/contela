import type { FonteCaptura } from './compartilhamento';

export interface ProgressoAtualizacao {
    percentual: number;
    bytesPorSegundo: number;
    transferido: number;
    total: number;
}

export interface StatusAtualizacao {
    estado: 'nenhum' | 'baixando' | 'pronta' | 'erro';
    versao?: string;
    progresso?: ProgressoAtualizacao;
}


declare global {
    interface Window {
        contela?: {
            ehDesktop: true;
            audioPorJanela: boolean;
            salaInicial: () => Promise<string | null>;
            aoReceberSala: (cb: (salaId: string) => void) => () => void;
            atualizacaoStatus: () => Promise<StatusAtualizacao>;
            aoMudarAtualizacao: (cb: (status: StatusAtualizacao) => void) => () => void;
            reiniciarParaAtualizar: () => Promise<void>;
            listarFontes: () => Promise<FonteCaptura[]>;
            selecionarFonte: (escolha: { id: string; audio: boolean }) => Promise<void>;
            iniciarAudioJanela: (fonteId: string) => Promise<{ sampleRate: number; canais: number; bits: number } | null>;
            pararAudioJanela: () => Promise<void>;
            aoReceberAudio: (cb: (pedaco: Uint8Array) => void) => () => void;
        };
    }
}
