import type { FonteCaptura } from './compartilhamento';

export {};

declare global {
    interface Window {
        contela?: {
            ehDesktop: true;
            audioPorJanela: boolean;
            salaInicial: () => Promise<string | null>;
            aoReceberSala: (cb: (salaId: string) => void) => () => void;
            listarFontes: () => Promise<FonteCaptura[]>;
            selecionarFonte: (escolha: { id: string; audio: boolean }) => Promise<void>;
            iniciarAudioJanela: (fonteId: string) => Promise<{ sampleRate: number; canais: number; bits: number } | null>;
            pararAudioJanela: () => Promise<void>;
            aoReceberAudio: (cb: (pedaco: Uint8Array) => void) => () => void;
        };
    }
}
