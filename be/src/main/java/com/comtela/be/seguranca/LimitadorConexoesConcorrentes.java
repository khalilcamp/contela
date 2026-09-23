package com.comtela.be.seguranca;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class LimitadorConexoesConcorrentes {

    private static final int MAXIMO_CONEXOES_SIMULTANEAS_POR_IP = 15;

    private final Map<String, AtomicInteger> conexoesPorIp = new ConcurrentHashMap<>();

    public boolean tentarRegistrar(String ip) {
        AtomicInteger contador = conexoesPorIp.computeIfAbsent(ip, k -> new AtomicInteger());
        while (true) {
            int atual = contador.get();
            if (atual >= MAXIMO_CONEXOES_SIMULTANEAS_POR_IP) {
                return false;
            }
            if (contador.compareAndSet(atual, atual + 1)) {
                return true;
            }
        }
    }

    public void liberar(String ip) {
        if (ip == null) {
            return;
        }
        conexoesPorIp.computeIfPresent(ip, (k, contador) -> {
            int restante = contador.decrementAndGet();
            return restante > 0 ? contador : null;
        });
    }
}
