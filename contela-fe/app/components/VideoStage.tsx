import { Integrante } from '../types/sala';
import { corAvatar } from '../lib/avatar';
import { DiagnosticoPeer } from '../lib/diagnostico';
import { Enquadramento } from './Enquadramento';
import { GradeParticipantes } from './GradeParticipantes';
import { IndicadorConexao } from './IndicadorConexao';
import { AcaoTile } from './TileParticipante';
import { TiraParticipantes } from './TiraParticipantes';
import { VideoTransmissao } from './VideoTransmissao';

interface VideoStageProps {
    streamLocal: MediaStream | null;
    meuId: string | null;
    participantes: Integrante[];
    streamsRemotas: Map<string, MediaStream>;
    acoesPara?: (participante: Integrante) => AcaoTile[];
    diagnostico: DiagnosticoPeer[];
    onAbrirDiagnostico: () => void;
    silenciado: boolean;
    onSilenciadoChange: (silenciado: boolean) => void;
}

export function VideoStage({
    streamLocal,
    meuId,
    participantes,
    streamsRemotas,
    acoesPara,
    diagnostico,
    onAbrirDiagnostico,
    silenciado,
    onSilenciadoChange,
}: VideoStageProps) {
    const sharer = participantes.find((p) => p.compartilhando) ?? null;

    if (!sharer) {
        return <GradeParticipantes participantes={participantes} meuId={meuId} acoesPara={acoesPara} />;
    }

    const souEuQueCompartilho = sharer.id === meuId;
    const streamRemotaAtiva = !souEuQueCompartilho ? streamsRemotas.get(sharer.id) : undefined;

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-ink">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
                <Enquadramento className="h-full w-full bg-black">
                    <VideoTransmissao
                        stream={souEuQueCompartilho ? streamLocal : (streamRemotaAtiva ?? null)}
                        mudo={souEuQueCompartilho}
                        controles={!souEuQueCompartilho}
                        silenciado={silenciado}
                        onSilenciadoChange={onSilenciadoChange}
                        className="h-full w-full object-contain"
                    />
                    <IndicadorConexao
                        diagnostico={diagnostico}
                        souQuemTransmite={souEuQueCompartilho}
                        onAbrir={onAbrirDiagnostico}
                    />
                    <span
                        className="absolute bottom-3 left-3 rounded-md px-2.5 py-1 text-xs font-medium text-ink"
                        style={{ backgroundColor: corAvatar(sharer.id) }}
                    >
                        {sharer.nome}
                        {souEuQueCompartilho ? ' (você)' : ''}
                    </span>
                </Enquadramento>
            </div>

            <TiraParticipantes participantes={participantes} meuId={meuId} acoesPara={acoesPara} />
        </div>
    );
}
