import { VERSAO_APP } from '../lib/versao';
import { IconEscudo } from './icons';

const EMAIL_CONTATO = 'linkpetprofessional@gmail.com';

export function RodapeSite({ onAbrirSeguranca }: { onAbrirSeguranca: () => void }) {
    return (
        <footer className="border-t border-line px-6 py-10 sm:px-12 lg:px-20">
            <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-mute">Contela — versão {VERSAO_APP}</p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-mute">
                    <button
                        type="button"
                        onClick={onAbrirSeguranca}
                        className="flex items-center gap-1.5 transition hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <IconEscudo className="h-4 w-4" />
                        Privacidade e segurança
                    </button>
                    <a
                        href={`mailto:${EMAIL_CONTATO}`}
                        className="transition hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        Contato
                    </a>
                </div>
            </div>
        </footer>
    );
}
