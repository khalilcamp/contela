package com.comtela.be.ent;

import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Data
public class Sala {

    private final String idSala;
    private final Instant criadaEm;

    private final Map<String, Integrante> participantes = new ConcurrentHashMap<>();

    public Sala(String id) {
        this.idSala = id;
        this.criadaEm = Instant.now();
    }
}
