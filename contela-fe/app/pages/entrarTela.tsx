import { useEffect, useState } from 'react';
import { linkDoApp, salaIdValido } from '../lib/convite';
import type { EstadoServidor } from '../lib/servidor';
import { BaixarApp } from '../components/BaixarApp';
import { DialogoSeguranca } from '../components/DialogoSeguranca';
import FormularioSala from '../components/formularioSala';
import { IconEscudo } from '../components/icons';
import { MosaicoTelas } from '../components/MosaicoTelas';
import { PillPessoasOnline } from '../components/PillPessoasOnline';
import { PromoLinkpet } from '../components/PromoLinkpet';
import type { ChapeuEscolha } from '../types/sala';

interface EntrarTelaProps {
    nome: string;
    salaId: string;
    senha: string;
    cor: string;
    chapeu: ChapeuEscolha;
    erro: string | null;
    entrando: boolean;
    servidor: EstadoServidor;
    servidorAcordou: boolean;
    onNomeChange: (valor: string) => void;
    onSalaIdChange: (valor: string) => void;
    onSenhaChange: (valor: string) => void;
    onCorChange: (valor: string) => void;
    onChapeuChange: (valor: ChapeuEscolha) => void;
    onEntrar: () => void;
    onCriar: () => void;
}

export default function EntrarTela({
    nome,
    salaId,
    senha,
    cor,
    chapeu,
    erro,
    entrando,
    servidor,
    servidorAcordou,
    onNomeChange,
    onSalaIdChange,
    onSenhaChange,
    onCorChange,
    onChapeuChange,
    onEntrar,
    onCriar,
}: EntrarTelaProps) {
    const [segurancaAberta, setSegurancaAberta] = useState(false);
    const [noNavegador, setNoNavegador] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- window so existe no cliente (evita hydration mismatch)
        setNoNavegador(window.contela === undefined);
    }, []);

    return (
        <div
            className="grid min-h-screen text-paper lg:grid-cols-[1.1fr_1fr]"
            style={{
                background:
                    'radial-gradient(900px 560px at 8% -6%, rgba(94,234,212,0.16), transparent 58%),' +
                    'radial-gradient(800px 560px at 96% 8%, rgba(129,140,248,0.14), transparent 58%),' +
                    '#0c0d12',
            }}
        >
            <div className="hidden flex-col justify-between border-r border-line px-16 py-16 lg:flex">
                <div className="flex flex-col items-start gap-3">
                    <p className="font-display text-2xl font-semibold tracking-tight">Contela</p>
                    <PillPessoasOnline />
                </div>

                <div className="flex flex-col items-start gap-8">
                    <MosaicoTelas />
                    <p className="max-w-xs text-sm text-mute">
                        É assim que fica quando alguém compartilha a tela — em tempo real, para quem está na sala.
                    </p>
                </div>

                <div className="flex flex-row flex-wrap items-start gap-3">
                    {noNavegador && <BaixarApp />}
                    <PromoLinkpet />
                </div>
            </div>

            <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
                <div className="mb-10 flex flex-col items-start gap-3 lg:hidden">
                    <p className="font-display text-2xl font-semibold tracking-tight">Contela</p>
                    <PillPessoasOnline />
                </div>

                <div className="w-full max-w-sm">
                    <FormularioSala
                        nome={nome}
                        salaId={salaId}
                        senha={senha}
                        cor={cor}
                        chapeu={chapeu}
                        erro={erro}
                        entrando={entrando}
                        servidor={servidor}
                        servidorAcordou={servidorAcordou}
                        onNomeChange={onNomeChange}
                        onSalaIdChange={onSalaIdChange}
                        onSenhaChange={onSenhaChange}
                        onCorChange={onCorChange}
                        onChapeuChange={onChapeuChange}
                        onEntrar={onEntrar}
                        onCriar={onCriar}
                    />
                    {noNavegador && salaIdValido(salaId) && (
                        <p className="mt-4 text-xs text-mute">
                            Tem o app do Contela instalado?{' '}
                            <a
                                href={linkDoApp(salaId)}
                                className="text-signal underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-signal"
                            >
                                Abrir esta sala no app
                            </a>
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={() => setSegurancaAberta(true)}
                        className="mt-5 flex items-center gap-2 text-xs text-mute transition hover:text-paper focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        <IconEscudo className="h-4 w-4" />
                        Privacidade, segurança e denúncias
                    </button>
                </div>

                {noNavegador && <BaixarApp className="mt-8 lg:hidden" />}
                <PromoLinkpet className="mt-8 lg:hidden" />
            </div>

            <DialogoSeguranca aberto={segurancaAberta} onFechar={() => setSegurancaAberta(false)} />
        </div>
    );
}
