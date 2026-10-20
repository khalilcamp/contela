import { IconCheck, IconMenosLeve } from './icons';
import { Mascote } from './Mascote';

interface Linha {
    pergunta: string;
    contela: boolean;
    zoom: boolean;
    meet: boolean;
    jitsi: boolean;
}

const LINHAS: Linha[] = [
    { pergunta: 'Entra sem criar conta', contela: true, zoom: false, meet: false, jitsi: true },
    { pergunta: 'Grátis, sem limite de tempo', contela: true, zoom: false, meet: false, jitsi: true },
    { pergunta: 'Vídeo direto entre navegadores, sem passar pelo servidor', contela: true, zoom: false, meet: false, jitsi: false },
    { pergunta: 'App leve pra desktop com atualização automática', contela: true, zoom: true, meet: false, jitsi: true },
];

function Marca({ ativo, sublinhado }: { ativo: boolean; sublinhado?: boolean }) {
    return (
        <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                ativo ? (sublinhado ? 'bg-signal text-signal-ink' : 'text-signal') : 'text-mute/50'
            }`}
        >
            {ativo ? <IconCheck className="h-4 w-4" /> : <IconMenosLeve className="h-4 w-4" />}
        </span>
    );
}

export function SecaoComparativo() {
    return (
        <section aria-labelledby="comparativo-titulo" className="border-t border-line bg-ink-2/40 px-6 py-20 sm:px-12 lg:px-20">
            <div className="mx-auto max-w-4xl">
                <h2 id="comparativo-titulo" className="font-display text-3xl font-semibold tracking-tight text-paper">
                    Onde o Contela se encaixa
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
                    Não competimos em recurso — Zoom e Meet fazem muito mais coisa. Competimos em não pedir nada de
                    quem só quer mostrar a tela pra alguém por cinco minutos.
                </p>

                <div className="mt-10 overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-mute">
                                <th scope="col" className="py-3 pr-4 font-normal" />
                                <th scope="col" className="px-4 py-3 font-medium text-paper">
                                    <span className="inline-flex items-center gap-2">
                                        <Mascote acento="#5eead4" flutuar={false} className="h-6 w-6" />
                                        Contela
                                    </span>
                                </th>
                                <th scope="col" className="px-4 py-3 font-normal">
                                    Zoom
                                </th>
                                <th scope="col" className="px-4 py-3 font-normal">
                                    Google Meet
                                </th>
                                <th scope="col" className="px-4 py-3 font-normal">
                                    Jitsi Meet
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {LINHAS.map((linha) => (
                                <tr key={linha.pergunta} className="border-b border-line/60 last:border-0">
                                    <th scope="row" className="py-4 pr-4 text-left font-normal text-paper">
                                        {linha.pergunta}
                                    </th>
                                    <td className="px-4 py-4">
                                        <Marca ativo={linha.contela} sublinhado />
                                    </td>
                                    <td className="px-4 py-4">
                                        <Marca ativo={linha.zoom} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <Marca ativo={linha.meet} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <Marca ativo={linha.jitsi} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
