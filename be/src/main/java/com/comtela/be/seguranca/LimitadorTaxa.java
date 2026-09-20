package com.comtela.be.seguranca;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class LimitadorTaxa {

    private static final int CHAMADAS_ENTRE_LIMPEZAS = 500;
    private static final long VALIDADE_MS = 10 * 60_000L;

    private final Map<String, Deque<Long>> janelas = new ConcurrentHashMap<>();
    private final AtomicInteger chamadas = new AtomicInteger();

    public boolean permitir(String chave, int maximo, long janelaMs) {
        limparSeNecessario();
        long agora = System.currentTimeMillis();
        Deque<Long> registros = janelas.computeIfAbsent(chave, k -> new ArrayDeque<>());
        synchronized (registros) {
            while (!registros.isEmpty() && agora - registros.peekFirst() > janelaMs) {
                registros.pollFirst();
            }
            if (registros.size() >= maximo) {
                return false;
            }
            registros.addLast(agora);
            return true;
        }
    }

    public void esquecer(String... chaves) {
        for (String chave : chaves) {
            janelas.remove(chave);
        }
    }

    private void limparSeNecessario() {
        if (chamadas.incrementAndGet() % CHAMADAS_ENTRE_LIMPEZAS != 0) {
            return;
        }
        long agora = System.currentTimeMillis();
        janelas.entrySet().removeIf(entrada -> {
            Deque<Long> registros = entrada.getValue();
            synchronized (registros) {
                return registros.isEmpty() || agora - registros.peekLast() > VALIDADE_MS;
            }
        });
    }
}
