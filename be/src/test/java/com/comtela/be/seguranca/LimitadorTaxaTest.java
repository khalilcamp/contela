package com.comtela.be.seguranca;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LimitadorTaxaTest {

    @Test
    void permiteAteOMaximoEBloqueiaDepois() {
        LimitadorTaxa limitador = new LimitadorTaxa();

        for (int i = 0; i < 3; i++) {
            assertTrue(limitador.permitir("chave", 3, 60_000));
        }
        assertFalse(limitador.permitir("chave", 3, 60_000));
    }

    @Test
    void chavesDiferentesNaoSeAfetam() {
        LimitadorTaxa limitador = new LimitadorTaxa();

        assertTrue(limitador.permitir("a", 1, 60_000));
        assertFalse(limitador.permitir("a", 1, 60_000));
        assertTrue(limitador.permitir("b", 1, 60_000));
    }

    @Test
    void liberaDepoisQueAJanelaPassa() throws InterruptedException {
        LimitadorTaxa limitador = new LimitadorTaxa();

        assertTrue(limitador.permitir("chave", 1, 50));
        assertFalse(limitador.permitir("chave", 1, 50));
        Thread.sleep(80);
        assertTrue(limitador.permitir("chave", 1, 50));
    }

    @Test
    void esquecerReiniciaOContador() {
        LimitadorTaxa limitador = new LimitadorTaxa();

        assertTrue(limitador.permitir("chave", 1, 60_000));
        assertFalse(limitador.permitir("chave", 1, 60_000));
        limitador.esquecer("chave");
        assertTrue(limitador.permitir("chave", 1, 60_000));
    }
}
