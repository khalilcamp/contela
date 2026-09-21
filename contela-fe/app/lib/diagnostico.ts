export type ViaConexao = 'direta' | 'retransmissao' | 'indefinida';
export type NivelConexao = 'ok' | 'atencao' | 'erro';

export interface DiagnosticoPeer {
    peerId: string;
    estadoIce: string;
    estadoConexao: string;
    via: ViaConexao;
    tipoLocal: string | null;
    tipoRemoto: string | null;
    protocolo: string | null;
    rttMs: number | null;
    kbpsRecebendo: number | null;
    kbpsEnviando: number | null;
    fps: number | null;
    largura: number | null;
    altura: number | null;
    perdaPct: number | null;
    limitacao: string | null;
}

export interface ContextoDiagnostico {
    versao: string;
    plataforma: string;
    servidoresIce: string[];
    participantes: number;
    navegador: string;
}

export function rotuloVia(via: ViaConexao): string {
    if (via === 'direta') return 'Direta';
    if (via === 'retransmissao') return 'Via retransmissão';
    return 'Indefinida';
}

export function resumirConexoes(peers: DiagnosticoPeer[]): { rotulo: string; nivel: NivelConexao } {
    if (peers.length === 0) return { rotulo: 'Conectando', nivel: 'atencao' };
    if (peers.some((p) => p.estadoConexao === 'failed' || p.estadoIce === 'failed')) {
        return { rotulo: 'Falhou', nivel: 'erro' };
    }
    if (peers.some((p) => p.estadoIce === 'disconnected')) return { rotulo: 'Instável', nivel: 'atencao' };
    if (peers.some((p) => p.estadoIce !== 'connected' && p.estadoIce !== 'completed')) {
        return { rotulo: 'Conectando', nivel: 'atencao' };
    }
    if (peers.some((p) => p.via === 'retransmissao')) return { rotulo: 'Via retransmissão', nivel: 'ok' };
    return { rotulo: 'Direta', nivel: 'ok' };
}

export function formatarTaxa(kbps: number | null): string {
    if (kbps === null) return '-';
    return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${Math.round(kbps)} kbps`;
}

export function formatarResolucao(largura: number | null, altura: number | null, fps: number | null): string {
    if (!largura || !altura) return '-';
    return `${largura}x${altura}${fps ? ` a ${Math.round(fps)} fps` : ''}`;
}

export function montarTextoDiagnostico(contexto: ContextoDiagnostico, peers: DiagnosticoPeer[]): string {
    const linhas = [
        'Contela - diagnóstico de conexão',
        `Versão: ${contexto.versao} (${contexto.plataforma})`,
        `Servidores de conexão: ${contexto.servidoresIce.join(', ') || 'nenhum'}`,
        `Participantes na sala: ${contexto.participantes}`,
        `Navegador: ${contexto.navegador}`,
        '',
    ];

    if (peers.length === 0) {
        linhas.push('Nenhuma conexão de vídeo ativa.');
    } else {
        peers.forEach((p, i) => {
            linhas.push(
                `Conexão ${i + 1}: ice=${p.estadoIce}, conexão=${p.estadoConexao}, via=${rotuloVia(p.via)} ` +
                    `(local ${p.tipoLocal ?? '?'}, remoto ${p.tipoRemoto ?? '?'}, ${p.protocolo ?? '?'}), ` +
                    `latência=${p.rttMs === null ? '?' : Math.round(p.rttMs) + ' ms'}, ` +
                    `recebendo=${formatarTaxa(p.kbpsRecebendo)}, enviando=${formatarTaxa(p.kbpsEnviando)}, ` +
                    `vídeo=${formatarResolucao(p.largura, p.altura, p.fps)}, ` +
                    `perda=${p.perdaPct === null ? '?' : p.perdaPct.toFixed(1) + '%'}, ` +
                    `limitação=${p.limitacao ?? '-'}`
            );
        });
    }
    return linhas.join('\n');
}
