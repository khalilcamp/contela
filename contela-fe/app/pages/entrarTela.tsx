import FormularioSala from '../components/formularioSala';
import { MosaicoTelas } from '../components/MosaicoTelas';

interface EntrarTelaProps {
    nome: string;
    salaId: string;
    onNomeChange: (valor: string) => void;
    onSalaIdChange: (valor: string) => void;
    onEntrar: () => void;
}

export default function EntrarTela({ nome, salaId, onNomeChange, onSalaIdChange, onEntrar }: EntrarTelaProps) {
    return (
        <div
            className="grid min-h-screen text-discord-text lg:grid-cols-[1.1fr_1fr]"
            style={{
                background:
                    'radial-gradient(1000px 600px at 6% -8%, rgba(99,102,241,0.38), transparent 55%),' +
                    'radial-gradient(800px 550px at 95% 10%, rgba(168,85,247,0.26), transparent 55%),' +
                    'radial-gradient(900px 600px at 25% 115%, rgba(45,212,191,0.16), transparent 55%),' +
                    '#0e0f13',
            }}
        >
            <div className="hidden flex-col justify-between border-r border-lobby-border/60 px-16 py-16 lg:flex">
                <p className="font-display text-2xl font-semibold tracking-tight">Contela</p>

                <div className="flex flex-col items-start gap-8">
                    <MosaicoTelas />
                    <p className="max-w-xs text-sm text-discord-text-muted">
                        É assim que fica quando alguém compartilha a tela — em tempo real, para quem está na sala.
                    </p>
                </div>

                <p className="text-xs text-discord-text-muted">
                    Chat e compartilhamento de tela, sem instalar nada.
                </p>
            </div>

            <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
                <p className="mb-10 font-display text-2xl font-semibold tracking-tight lg:hidden">Contela</p>

                <div className="w-full max-w-sm">
                    <FormularioSala
                        nome={nome}
                        salaId={salaId}
                        onNomeChange={onNomeChange}
                        onSalaIdChange={onSalaIdChange}
                        onEntrar={onEntrar}
                    />
                </div>
            </div>
        </div>
    );
}
