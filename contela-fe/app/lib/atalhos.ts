export type AcaoAtalho = 'silenciar' | 'chat' | 'parar' | 'ajuda';

export interface DefinicaoAtalho {
    acao: AcaoAtalho;
    descricao: string;
    tecla: string | null;
    global: string | null;
}

export const ATALHOS: DefinicaoAtalho[] = [
    { acao: 'silenciar', descricao: 'Silenciar ou ativar o som de quem você assiste', tecla: 'M', global: 'Ctrl + Alt + Shift + M' },
    { acao: 'chat', descricao: 'Abrir ou fechar o chat', tecla: 'C', global: 'Ctrl + Alt + Shift + C' },
    { acao: 'parar', descricao: 'Parar de compartilhar', tecla: null, global: 'Ctrl + Alt + Shift + S' },
    { acao: 'ajuda', descricao: 'Mostrar esta lista de atalhos', tecla: '?', global: null },
];

const COMBINACOES: Record<string, AcaoAtalho> = {
    KeyM: 'silenciar',
    KeyC: 'chat',
    KeyS: 'parar',
};

const CAMPOS_DE_TEXTO = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

export function acaoDaTecla(evento: KeyboardEvent): AcaoAtalho | null {
    if (evento.defaultPrevented || evento.repeat) return null;
    const alvo = evento.target instanceof Element ? evento.target : null;
    if (alvo?.closest(CAMPOS_DE_TEXTO)) return null;

    if (evento.ctrlKey && evento.altKey && evento.shiftKey && !evento.metaKey) {
        return COMBINACOES[evento.code] ?? null;
    }
    if (evento.ctrlKey || evento.altKey || evento.metaKey) return null;

    if (evento.key === '?') return 'ajuda';
    if (evento.shiftKey) return null;
    if (evento.key === 'm' || evento.key === 'M') return 'silenciar';
    if (evento.key === 'c' || evento.key === 'C') return 'chat';
    return null;
}
