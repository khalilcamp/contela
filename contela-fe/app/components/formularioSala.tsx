import { IconSala, IconUsuario } from './icons';

interface FormularioSalaProps {
    nome: string;
    salaId: string;
    onNomeChange: (valor: string) => void;
    onSalaIdChange: (valor: string) => void;
    onEntrar: () => void;
}

export default function FormularioSala({ nome, salaId, onNomeChange, onSalaIdChange, onEntrar }: FormularioSalaProps) {
    return (
        <div className="rounded-2xl border border-lobby-border bg-discord-bg-secondary/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-discord-text">
                Entrar na sala
            </h1>
            <p className="mt-2 text-sm text-discord-text-muted">
                Informe seu nome e a sala para começar a conversar.
            </p>

            <div className="mt-8 flex flex-col gap-5">
                <div>
                    <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-discord-text">
                        Seu nome
                    </label>
                    <div className="relative">
                        <IconUsuario className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-discord-text-muted" />
                        <input
                            id="nome"
                            className="w-full rounded-lg border border-transparent bg-discord-bg-tertiary/80 py-2.5 pl-9 pr-3.5 text-sm text-discord-text outline-none transition placeholder:text-discord-text-muted focus:border-discord-brand focus:ring-2 focus:ring-discord-brand/30"
                            placeholder="Como você quer ser chamado"
                            value={nome}
                            onChange={(e) => onNomeChange(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="salaId" className="mb-1.5 block text-sm font-medium text-discord-text">
                        Sala
                    </label>
                    <div className="relative">
                        <IconSala className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-discord-text-muted" />
                        <input
                            id="salaId"
                            className="w-full rounded-lg border border-transparent bg-discord-bg-tertiary/80 py-2.5 pl-9 pr-3.5 text-sm text-discord-text outline-none transition placeholder:text-discord-text-muted focus:border-discord-brand focus:ring-2 focus:ring-discord-brand/30"
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
                    className="mt-2 w-full rounded-lg bg-gradient-to-b from-[#6b74f5] to-discord-brand py-2.5 text-sm font-medium text-white shadow-lg shadow-discord-brand/30 transition hover:shadow-discord-brand/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                    Entrar
                </button>
            </div>
        </div>
    );
}
