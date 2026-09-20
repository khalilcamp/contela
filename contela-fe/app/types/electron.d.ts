import type { FonteCaptura } from './compartilhamento';

export {};

declare global {
    interface Window {
        contela?: {
            ehDesktop: true;
            salaInicial: () => Promise<string | null>;
            aoReceberSala: (cb: (salaId: string) => void) => () => void;
            listarFontes: () => Promise<FonteCaptura[]>;
            selecionarFonte: (escolha: { id: string; audio: boolean }) => Promise<void>;
        };
    }
}
