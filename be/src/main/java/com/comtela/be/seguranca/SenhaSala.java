package com.comtela.be.seguranca;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;

public final class SenhaSala {

    private static final int ITERACOES = 20_000;
    private static final int BITS_CHAVE = 256;
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private SenhaSala() {
    }

    public static byte[] gerarSalt() {
        byte[] salt = new byte[16];
        ALEATORIO.nextBytes(salt);
        return salt;
    }

    public static byte[] hash(String senha, byte[] salt) {
        try {
            PBEKeySpec spec = new PBEKeySpec(senha.toCharArray(), salt, ITERACOES, BITS_CHAVE);
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao processar a senha.");
        }
    }
}
