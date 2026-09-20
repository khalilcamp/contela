'use client';

import { useState } from 'react';
import { IconSala, IconUsuario } from './icons';

interface FormularioSalaProps {
    nome: string;
    salaId: string;
    senha: string;
    erro: string | null;
    entrando: boolean;
    onNomeChange: (valor: string) => void;
    onSalaIdChange: (valor: string) => void;
    onSenhaChange: (valor: string) => void;
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
    erro,
    entrando,
    onNomeChange,
    onSalaIdChange,
    onSenhaChange,
    onEntrar,
    onCriar,
}: FormularioSalaProps) {
    const [modo, setModo] = useState<Modo>('entrar');
    const criando = modo === 'criar';
    const incompleto = !nome.trim() || (!criando && !salaId.trim());

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
                        onClick={() => setModo(opcao)}
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
                    ? 'Você recebe um código para convidar quem quiser. Uma senha é opcional.'
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

                <div>
                    <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-paper">
                        {criando ? 'Senha da sala (opcional)' : 'Senha (se a sala tiver)'}
                    </label>
                    <input
                        id="senha"
                        type="password"
                        className={`${CAMPO} pl-3.5`}
                        placeholder={criando ? 'Deixe vazio para uma sala aberta' : 'Deixe vazio se não tiver'}
                        maxLength={64}
                        autoComplete="off"
                        value={senha}
                        onChange={(e) => onSenhaChange(e.target.value)}
                    />
                </div>

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
                    {entrando ? 'Conectando' : criando ? 'Criar sala e entrar' : 'Entrar'}
                </button>
            </div>
        </form>
    );
}
