import { Integrante } from '../types/sala';
import { TileParticipante } from './TileParticipante';

interface TiraParticipantesProps {
    participantes: Integrante[];
    meuId: string | null;
}

export function TiraParticipantes({ participantes, meuId }: TiraParticipantesProps) {
    return (
        <div className="flex shrink-0 gap-3 overflow-x-auto border-t border-white/[0.06] bg-black px-4 py-3">
            {participantes.map((p) => (
                <div key={p.id} className="h-20 w-20 shrink-0">
                    <TileParticipante
                        id={p.id}
                        nome={p.nome}
                        meuId={meuId}
                        compartilhando={p.compartilhando}
                        tamanhoAvatar={28}
                    />
                </div>
            ))}
        </div>
    );
}
