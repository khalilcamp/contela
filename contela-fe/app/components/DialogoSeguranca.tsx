'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { VERSAO_APP } from '../lib/versao';
import { IconCopiar, IconFechar } from './icons';

const EMAIL_CONTATO = 'linkpetprofessional@gmail.com';

interface DialogoSegurancaProps {
    aberto: boolean;
    onFechar: () => void;
    salaId?: string | null;
}

export function DialogoSeguranca({ aberto, onFechar, salaId }: DialogoSegurancaProps) {
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (!aberto) return;
        const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
        window.addEventListener('keydown', aoTeclar);
        return () => window.removeEventListener('keydown', aoTeclar);
    }, [aberto, onFechar]);

    if (!aberto) return null;

    const assunto = encodeURIComponent('Denúncia - Contela');
    const corpo = encodeURIComponent(
        `Código da sala: ${salaId ?? ''}\nDia e horário aproximado: \nO que aconteceu: \n`
    );
    const enderecoMail = `mailto:${EMAIL_CONTATO}?subject=${assunto}&body=${corpo}`;

    async function copiarEmail() {
        try {
            await navigator.clipboard.writeText(EMAIL_CONTATO);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {}
    }

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div onClick={onFechar} className="absolute inset-0 bg-black/60" />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-seguranca"
                className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-ink-2 shadow-2xl shadow-black/60"
            >
                <header className="flex items-center justify-between border-b border-line px-6 py-4">
                    <h2 id="titulo-seguranca" className="font-display text-lg font-semibold tracking-tight text-paper">
                        Privacidade e segurança
                    </h2>
                    <button
                        onClick={onFechar}
                        aria-label="Fechar"
                        className="rounded-md p-1.5 text-mute transition hover:bg-ink-3 hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <IconFechar className="h-5 w-5" />
                    </button>
                </header>

                <div className="space-y-6 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-paper/80 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
                    <section>
                        <h3 className="mb-1.5 font-medium text-paper">O que o Contela guarda</h3>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Nada é gravado: vídeo, áudio e mensagens do chat não ficam salvos no servidor.</li>
                            <li>
                                Não pedimos cadastro nem idade. O servidor só conhece o apelido que você digita e o
                                código da sala, e apenas enquanto você está nela.
                            </li>
                            <li>
                                A hospedagem do servidor e os servidores usados para a conexão (STUN e TURN) enxergam
                                o seu endereço IP. Quem está na sala também pode descobrir o seu IP pela conexão
                                direta.
                            </li>
                            <li>Vídeo e áudio seguem cifrados entre os participantes.</li>
                            <li>
                                O app informa ao servidor a versão instalada, apenas para avisar quando houver uma
                                atualização. Você está na versão {VERSAO_APP}.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="mb-1.5 font-medium text-paper">Como as salas funcionam</h3>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                Só entra quem tem o código da sala (gerado aleatoriamente) e a senha, se houver.
                                Recomendamos usar senha.
                            </li>
                            <li>
                                Quem cria a sala é o anfitrião: pode remover pessoas e encerrar a transmissão de
                                alguém.
                            </li>
                            <li>
                                Qualquer participante pode gravar ou fotografar a tela. Compartilhe só com quem você
                                confia.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="mb-1.5 font-medium text-paper">Para pais e responsáveis</h3>
                        <p>
                            O Contela não é direcionado a crianças e adolescentes. Se um menor usar, converse com ele
                            sobre não entrar em salas de desconhecidos, não compartilhar a tela nem o endereço IP com
                            estranhos e preferir salas com senha, criadas por alguém que vocês conheçam.
                        </p>
                    </section>

                    <section>
                        <h3 className="mb-1.5 font-medium text-paper">Denunciar ou pedir ajuda</h3>
                        <p>
                            Se algo errado aconteceu em uma sala, como assédio, ameaça, abuso ou qualquer violação de
                            direitos de crianças e adolescentes, escreva para{' '}
                            <span className="font-medium text-paper">{EMAIL_CONTATO}</span>. Informe o código da sala,
                            o dia e o horário e o que aconteceu. Não temos acesso ao conteúdo das salas, então quanto
                            mais detalhes, melhor. Vamos analisar cada denúncia e, quando for o caso, encerrar a sala e
                            encaminhar às autoridades.
                        </p>
                        <p className="mt-2">
                            Em risco imediato, ligue 190 (polícia) ou 192 (SAMU). Para violações contra crianças e
                            adolescentes, você também pode usar o Disque 100 ou a SaferNet Brasil.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <a
                                href={enderecoMail}
                                className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                            >
                                Enviar e-mail
                            </a>
                            <button
                                onClick={copiarEmail}
                                className="flex items-center gap-2 rounded-lg bg-ink-3 px-4 py-2 text-sm text-paper transition hover:bg-ink-3/70 focus-visible:outline-2 focus-visible:outline-signal"
                            >
                                <IconCopiar className="h-4 w-4 text-mute" />
                                {copiado ? 'E-mail copiado' : 'Copiar e-mail'}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>,
        document.body
    );
}
