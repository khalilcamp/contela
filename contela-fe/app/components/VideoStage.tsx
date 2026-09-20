import { Integrante } from '../types/sala';
import { corAvatar } from '../lib/avatar';
import { Enquadramento } from './Enquadramento';
import { GradeParticipantes } from './GradeParticipantes';
import { TiraParticipantes } from './TiraParticipantes';

interface VideoStageProps {
    streamLocal: MediaStream | null;
    meuId: string | null;
    participantes: Integrante[];
    streamsRemotas: Map<string, MediaStream>;
}

export function VideoStage({ streamLocal, meuId, participantes, streamsRemotas }: VideoStageProps) {
    const sharer = participantes.find((p) => p.compartilhando) ?? null;

    if (!sharer) {
        return <GradeParticipantes participantes={participantes} meuId={meuId} />;
    }

    const souEuQueCompartilho = sharer.id === meuId;
    const streamRemotaAtiva = !souEuQueCompartilho ? streamsRemotas.get(sharer.id) : undefined;

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-ink">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
                <Enquadramento className="h-full w-full bg-black">
                    {souEuQueCompartilho ? (
                        <video
                            autoPlay
                            muted
                            className="h-full w-full object-contain"
                            ref={(el) => {
                                if (el && streamLocal) el.srcObject = streamLocal;
                            }}
                        />
                    ) : (
                        <video
                            autoPlay
                            className="h-full w-full object-contain"
                            ref={(el) => {
                                if (el && streamRemotaAtiva) el.srcObject = streamRemotaAtiva;
                            }}
                        />
                    )}
                    <span
                        className="absolute bottom-3 left-3 rounded-md px-2.5 py-1 text-xs font-medium text-ink"
                        style={{ backgroundColor: corAvatar(sharer.id) }}
                    >
                        {sharer.nome}
                        {souEuQueCompartilho ? ' (você)' : ''}
                    </span>
                </Enquadramento>
            </div>

            <TiraParticipantes participantes={participantes} meuId={meuId} />
        </div>
    );
}
