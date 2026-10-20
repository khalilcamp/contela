import { IconLink, IconMonitor, IconSala } from './icons';

const PASSOS = [
    {
        icone: IconSala,
        titulo: 'Crie uma sala',
        texto: 'Escolha "Criar sala", proteja com senha se quiser, e pronto — sem e-mail, sem confirmação.',
    },
    {
        icone: IconLink,
        titulo: 'Mande o código',
        texto: 'Copie o link ou o código de 8 caracteres e envie por onde for mais fácil pra quem você quer chamar.',
    },
    {
        icone: IconMonitor,
        titulo: 'Compartilhe a tela',
        texto: 'Quem entrar já te vê no chat. Clique em compartilhar tela e o vídeo vai direto do seu navegador pro da outra pessoa.',
    },
];

export function SecaoComoFunciona() {
    return (
        <section aria-labelledby="como-funciona-titulo" className="border-t border-line px-6 py-20 sm:px-12 lg:px-20">
            <div className="mx-auto max-w-4xl">
                <h2 id="como-funciona-titulo" className="font-display text-3xl font-semibold tracking-tight text-paper">
                    Como funciona
                </h2>

                <ol className="mt-12 grid gap-10 sm:grid-cols-3">
                    {PASSOS.map((passo, indice) => {
                        const Icone = passo.icone;
                        const ultimo = indice === PASSOS.length - 1;
                        return (
                            <li key={passo.titulo} className="relative flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-signal/40 font-mono text-sm text-signal">
                                        {indice + 1}
                                    </span>
                                    {!ultimo && (
                                        <span aria-hidden className="hidden h-px flex-1 bg-line sm:block" />
                                    )}
                                </div>
                                <Icone className="h-6 w-6 text-mute" />
                                <div>
                                    <p className="text-base font-medium text-paper">{passo.titulo}</p>
                                    <p className="mt-1.5 text-sm leading-relaxed text-mute">{passo.texto}</p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
