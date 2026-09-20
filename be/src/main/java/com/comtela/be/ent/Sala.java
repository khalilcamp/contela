package com.comtela.be.ent;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Getter
public class Sala {

    private final String idSala;
    private final Instant criadaEm = Instant.now();
    private final String tokenDono;
    private final byte[] senhaSalt;
    private final byte[] senhaHash;
    private final Map<String, Integrante> participantes = new ConcurrentHashMap<>();

    @Setter
    private volatile String donoId;

    public Sala(String idSala, String tokenDono, byte[] senhaSalt, byte[] senhaHash) {
        this.idSala = idSala;
        this.tokenDono = tokenDono;
        this.senhaSalt = senhaSalt;
        this.senhaHash = senhaHash;
    }

    public boolean temSenha() {
        return senhaHash != null;
    }
}
