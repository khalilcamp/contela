import { DiagnosticoPeer, formatarResolucao, resumirConexoes } from '../lib/diagnostico';

interface IndicadorConexaoProps {
    diagnostico: DiagnosticoPeer[];
    souQuemTransmite: boolean;
    onAbrir: () => void;
}

const COR_PONTO = {
    ok: 'bg-signal',
    atencao: 'bg-amber-300',
    erro: 'bg-live',
} as const;

export function IndicadorConexao({ diagnostico, souQuemTransmite, onAbrir }: IndicadorConexaoProps) {
    const { rotulo, nivel } = resumirConexoes(diagnostico);
    const primeiro = diagnostico[0];

    let texto: string;
    if (souQuemTransmite) {
        const viaRetransmissao = diagnostico.filter((p) => p.via === 'retransmissao').length;
        texto = `Transmitindo para ${diagnostico.length}`;
        if (diagnostico.length > 0 && nivel === 'ok' && viaRetransmissao > 0) {
            texto += ` (${viaRetransmissao} via retransmissão)`;
        } else if (nivel !== 'ok') {
            texto += `: ${rotulo.toLowerCase()}`;
        }
    } else {
        texto = rotulo;
        const qualidade = primeiro ? formatarResolucao(primeiro.largura, primeiro.altura, primeiro.fps) : '-';
        if (nivel === 'ok' && qualidade !== '-') texto += ` (${qualidade})`;
    }

    return (
        <button
            onClick={onAbrir}
            title="Ver diagnóstico da conexão"
            className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-black/60 px-2.5 py-1 text-xs text-paper backdrop-blur-sm transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-signal"
        >
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${COR_PONTO[nivel]}`} />
            {texto}
        </button>
    );
}
