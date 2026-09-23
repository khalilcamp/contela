export interface Integrante {
    id: string;
    nome: string;
    compartilhando: boolean;
}

export interface SalaResponse {
    salaId: string;
    participantes: Integrante[];
    donoId: string | null;
}

export type TipoMensagem = 'TEXTO' | 'GIF';

export interface MensagemResponse {
    id: string;
    integranteId: string;
    nomeIntegrante: string;
    texto: string;
    tipo: TipoMensagem;
    enviadaEm: string;
}

export type TipoSinal = 'offer' | 'answer' | 'ice-candidate' | 'compartilhamento-parado';

export interface SinalWebRTC {
    tipo: TipoSinal;
    remetenteId: string;
    destinatarioId: string;
    payload: unknown;
}
