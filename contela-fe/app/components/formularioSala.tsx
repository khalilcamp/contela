'use client';

import { useState } from 'react';
import { gerarSenha } from '../lib/senha';
import type { EstadoServidor } from '../lib/servidor';
import { CHAPEUS_ESCOLHA, CORES_ESCOLHA } from '../lib/avatar';
import type { ChapeuEscolha } from '../types/sala';
import { IconCopiar, IconSala, IconUsuario } from './icons';
import { Mascote } from './Mascote';

interface FormularioSalaProps {
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

type Modo = 'entrar' | 'criar';

const CAMPO =
    'w-full rounded-lg border border-line bg-ink py-2.5 pr-3.5 text-sm text-paper outline-none transition placeholder:text-mute focus:border-signal focus:ring-2 focus:ring-signal/20';

export default function FormularioSala({
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
}: FormularioSalaProps) {
    const [modo, setModo] = useState<Modo>('entrar');
    const [proteger, setProteger] = useState(true);
    const [senhaCopiada, setSenhaCopiada] = useState(false);
    const criando = modo === 'criar';
    const incompleto = !nome.trim() || (!criando && !salaId.trim());

    function trocarModo(novo: Modo) {
        setModo(novo);
        onSenhaChange(novo === 'criar' && proteger ? gerarSenha() : '');
    }

    function alternarProteger(ativo: boolean) {
        setProteger(ativo);
        onSenhaChange(ativo ? gerarSenha() : '');
    }

    async function copiarSenha() {
        try {
            await navigator.clipboard.writeText(senha);
            setSenhaCopiada(true);
            setTimeout(() => setSenhaCopiada(false), 2000);
        } catch {}
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (incompleto || entrando) return;
                if (criando) onCriar();
                else onEntrar();
            }}
            className="rounded-xl border border-line bg-ink-2/70 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm"
        >
            <div role="tablist" aria-label="O que você quer fazer" className="mb-6 flex gap-5 border-b border-line">
                {(['entrar', 'criar'] as const).map((opcao) => (
                    <button
                        key={opcao}
                        type="button"
                        role="tab"
                        aria-selected={modo === opcao}
                        onClick={() => trocarModo(opcao)}
                        className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-signal ${
                            modo === opcao ? 'border-signal text-paper' : 'border-transparent text-mute hover:text-paper'
                        }`}
                    >
                        {opcao === 'entrar' ? 'Entrar' : 'Criar sala'}
                    </button>
                ))}
            </div>

            <h1 className="font-display text-3xl font-semibold tracking-tight text-paper">
                {criando ? 'Criar uma sala' : 'Entrar na sala'}
            </h1>
            <p className="mt-2 text-sm text-mute">
                {criando
                    ? 'Você recebe um código para convidar quem quiser. Recomendamos proteger com senha.'
                    : 'Informe seu nome e o código que você recebeu.'}
            </p>

            <div className="mt-8 flex flex-col gap-5">
                <div>
                    <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-paper">
                        Seu nome
                    </label>
                    <div className="relative">
                        <IconUsuario className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
                        <input
                            id="nome"
                            className={`${CAMPO} pl-9`}
                            placeholder="Como você quer ser chamado"
                            maxLength={24}
                            autoComplete="nickname"
                            value={nome}
                            onChange={(e) => onNomeChange(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-paper">Aparência</label>
                    <div className="flex items-center gap-4 rounded-lg border border-line bg-ink p-3">
                        <div className="h-14 w-14 shrink-0">
                            <Mascote acento={cor} chapeu={chapeu} estagioVisual={1} flutuar={false} className="h-full w-full" />
                        </div>
                        <div className="flex flex-1 flex-col gap-2.5">
                            <div className="flex gap-1.5">
                                {CORES_ESCOLHA.map((opcao) => (
                                    <button
                                        key={opcao}
                                        type="button"
                                        onClick={() => onCorChange(opcao)}
                                        aria-label={`Cor ${opcao}`}
                                        aria-pressed={cor === opcao}
                                        className={`h-6 w-6 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                                            cor === opcao ? 'ring-2 ring-paper ring-offset-2 ring-offset-ink' : 'opacity-70 hover:opacity-100'
                                        }`}
                                        style={{ backgroundColor: opcao }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-1.5">
                                {CHAPEUS_ESCOLHA.map((opcao) => (
                                    <button
                                        key={opcao.valor}
                                        type="button"
                                        onClick={() => onChapeuChange(opcao.valor)}
                                        aria-pressed={chapeu === opcao.valor}
                                        title={opcao.rotulo}
                                        className={`rounded-md px-2 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                                            chapeu === opcao.valor
                                                ? 'bg-signal text-signal-ink'
                                                : 'bg-ink-3 text-mute hover:text-paper'
                                        }`}
                                    >
                                        {opcao.rotulo}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {!criando && (
                    <div>
                        <label htmlFor="salaId" className="mb-1.5 block text-sm font-medium text-paper">
                            Código da sala
                        </label>
                        <div className="relative">
                            <IconSala className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
                            <input
                                id="salaId"
                                className={`${CAMPO} pl-9 uppercase`}
                                placeholder="ABCD-1234"
                                maxLength={12}
                                autoComplete="off"
                                spellCheck={false}
                                value={salaId}
                                onChange={(e) => onSalaIdChange(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {criando ? (
                    <div>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-paper">
                            <input
                                type="checkbox"
                                checked={proteger}
                                onChange={(e) => alternarProteger(e.target.checked)}
                                className="h-4 w-4 accent-[#5eead4]"
                            />
                            Proteger a sala com senha (recomendado)
                        </label>

                        {proteger && (
                            <div className="mt-3">
                                <div className="flex gap-2">
                                    <input
                                        id="senha"
                                        aria-label="Senha da sala"
                                        className={`${CAMPO} pl-3.5 font-mono tracking-wide`}
                                        maxLength={64}
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={senha}
                                        onChange={(e) => onSenhaChange(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={copiarSenha}
                                        title="Copiar senha"
                                        aria-label="Copiar senha"
                                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink-3 px-3 text-xs text-paper transition hover:bg-ink-3/70 focus-visible:outline-2 focus-visible:outline-signal"
                                    >
                                        <IconCopiar className="h-4 w-4 text-mute" />
                                        {senhaCopiada ? 'Copiada' : 'Copiar'}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSenhaChange(gerarSenha())}
                                    className="mt-2 text-xs text-mute underline-offset-4 transition hover:text-paper hover:underline focus-visible:outline-2 focus-visible:outline-signal"
                                >
                                    Gerar outra senha
                                </button>
                                <p className="mt-1 text-xs text-mute">Quem entrar precisa do código e desta senha.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-paper">
                            Senha (se a sala tiver)
                        </label>
                        <input
                            id="senha"
                            type="password"
                            className={`${CAMPO} pl-3.5`}
                            placeholder="Deixe vazio se não tiver"
                            maxLength={64}
                            autoComplete="off"
                            value={senha}
                            onChange={(e) => onSenhaChange(e.target.value)}
                        />
                    </div>
                )}

                {servidor === 'acordando' && (
                    <p role="status" className="flex items-start gap-2 text-sm text-mute">
                        <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal motion-safe:animate-pulse" />
                        O servidor estava dormindo e está acordando. Pode levar até um minuto; não precisa recarregar a página.
                    </p>
                )}
                {servidor === 'pronto' && servidorAcordou && (
                    <p role="status" className="text-sm text-signal">
                        Servidor pronto.
                    </p>
                )}
                {servidor === 'fora' && (
                    <p role="status" className="text-sm text-live">
                        Não foi possível falar com o servidor agora. Você ainda pode tentar entrar.
                    </p>
                )}

                {erro && (
                    <p role="alert" className="text-sm text-live">
                        {erro}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={incompleto || entrando}
                    className="mt-1 w-full rounded-lg bg-signal py-2.5 text-sm font-semibold text-signal-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {entrando ? (servidor === 'acordando' ? 'Acordando o servidor...' : 'Conectando') : criando ? 'Criar sala e entrar' : 'Entrar'}
                </button>
            </div>
        </form>
    );
}
