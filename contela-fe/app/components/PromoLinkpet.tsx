import { Mascote } from './Mascote';

const URL_LINKPET = 'https://linkpet.vercel.app/';

export function PromoLinkpet({ className = '' }: { className?: string }) {
    return (
        <a
            href={URL_LINKPET}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex max-w-sm items-center gap-3 rounded-xl border border-line bg-ink-2/60 p-3 pr-4 transition hover:border-signal/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${className}`}
        >
            <div className="h-11 w-11 shrink-0">
                <Mascote acento="#f97316" flutuar={false} className="h-full w-full transition-transform group-hover:-translate-y-0.5" />
            </div>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-paper">Gostou do Contela?</span>
                <span className="block text-xs text-mute">Conheça também o Linkpet, sua página de links com um pet que evolui.</span>
            </span>
            <span className="shrink-0 rounded-lg bg-signal px-3 py-1.5 text-xs font-semibold text-signal-ink transition group-hover:brightness-110">
                Visitar
            </span>
        </a>
    );
}
