package com.comtela.be.service;

import java.util.regex.Pattern;

public final class VersaoApp {

    private static final Pattern FORMATO = Pattern.compile("^\\d{1,4}\\.\\d{1,4}\\.\\d{1,4}$");

    private VersaoApp() {
    }

    public static boolean valida(String versao) {
        return versao != null && FORMATO.matcher(versao).matches();
    }

    public static boolean menor(String a, String b) {
        if (!valida(a) || !valida(b)) {
            return false;
        }
        int[] x = partes(a);
        int[] y = partes(b);
        for (int i = 0; i < 3; i++) {
            if (x[i] != y[i]) {
                return x[i] < y[i];
            }
        }
        return false;
    }

    private static int[] partes(String versao) {
        String[] pedacos = versao.split("\\.");
        return new int[]{Integer.parseInt(pedacos[0]), Integer.parseInt(pedacos[1]), Integer.parseInt(pedacos[2])};
    }
}
