import { IconSala, IconUsuario } from './icons';

interface FormularioSalaProps {
    nome: string;
    salaId: string;
    onNomeChange: (valor: string) => void;
    onSalaIdChange: (valor: string) => void;
    onEntrar: () => void;
}

const CAMPO =
    'w-full rounded-lg border border-line bg-ink py-2.5 pl-9 pr-3.5 text-sm text-paper outline-none transition placeholder:text-mute focus:border-signal focus:ring-2 focus:ring-signal/20';

export default function FormularioSala({ nome, salaId, onNomeChange, onSalaIdChange, onEntrar }: FormularioSalaProps) {
    return (
        <div className="rounded-xl border border-line bg-ink-2/70 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-paper">Entrar na sala</h1>
            <p className="mt-2 text-sm text-mute">Informe seu nome e a sala para começar a conversar.</p>

            <div className="mt-8 flex flex-col gap-5">
                <div>
                    <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-paper">
                        Seu nome
                    </label>
                    <div className="relative">
                        <IconUsuario className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
                        <input
                            id="nome"
                            className={CAMPO}
                            placeholder="Como você quer ser chamado"
                            value={nome}
                            onChange={(e) => onNomeChange(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="salaId" className="mb-1.5 block text-sm font-medium text-paper">
                        Sala
                    </label>
                    <div className="relative">
                        <IconSala className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
                        <input
                            id="salaId"
                            className={CAMPO}
                            placeholder="Código ou nome da sala"
                            value={salaId}
                            onChange={(e) => onSalaIdChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onEntrar()}
                        />
                    </div>
                </div>

                <button
                    onClick={onEntrar}
                    disabled={!nome || !salaId}
                    className="mt-2 w-full rounded-lg bg-signal py-2.5 text-sm font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Entrar
                </button>
            </div>
        </div>
    );
}
