package com.comtela.be.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VersaoAppTest {

    @Test
    void aceitaSoOFormatoNumericoComTresPartes() {
        assertTrue(VersaoApp.valida("0.1.3"));
        assertTrue(VersaoApp.valida("10.20.30"));
        assertFalse(VersaoApp.valida("abc"));
        assertFalse(VersaoApp.valida("1.2"));
        assertFalse(VersaoApp.valida("1.2.3.4"));
        assertFalse(VersaoApp.valida("1.2.x"));
        assertFalse(VersaoApp.valida(null));
        assertFalse(VersaoApp.valida(""));
    }

    @Test
    void comparaNumericamenteEnaoComoTexto() {
        assertTrue(VersaoApp.menor("0.1.3", "0.1.4"));
        assertTrue(VersaoApp.menor("0.9.0", "0.10.0"));
        assertTrue(VersaoApp.menor("0.1.9", "1.0.0"));
        assertFalse(VersaoApp.menor("0.1.4", "0.1.4"));
        assertFalse(VersaoApp.menor("0.2.0", "0.1.9"));
    }

    @Test
    void versaoInvalidaNuncaContaComoMenor() {
        assertFalse(VersaoApp.menor("abc", "0.1.4"));
        assertFalse(VersaoApp.menor("0.1.3", "abc"));
        assertFalse(VersaoApp.menor(null, "0.1.4"));
    }
}
