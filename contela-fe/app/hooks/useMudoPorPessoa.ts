'use client';

import { useState } from 'react';

const CHAVE_MUDOS = 'contela:mudos';

function chaveDoNome(nome: string): string {
    return nome.trim().toLowerCase();
}

function lerMudosSalvos(): Set<string> {
    try {
        const bruto = window.localStorage.getItem(CHAVE_MUDOS);
        const lista = bruto ? JSON.parse(bruto) : [];
        return new Set(Array.isArray(lista) ? lista : []);
    } catch {
        return new Set();
    }
}

export function useMudoPorPessoa() {
    const [mudos, setMudos] = useState<Set<string>>(lerMudosSalvos);

    function persistir(novo: Set<string>) {
        try {
            window.localStorage.setItem(CHAVE_MUDOS, JSON.stringify([...novo]));
        } catch {}
    }

    function alternarMudo(nome: string) {
        const chave = chaveDoNome(nome);
        setMudos((prev) => {
            const novo = new Set(prev);
            if (novo.has(chave)) novo.delete(chave);
            else novo.add(chave);
            persistir(novo);
            return novo;
        });
    }

    function estaMudo(nome: string): boolean {
        return mudos.has(chaveDoNome(nome));
    }

    return { estaMudo, alternarMudo };
}
