package com.comtela.be.controller;

import com.comtela.be.dto.ResponseErro;
import com.comtela.be.seguranca.LimitadorTaxa;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ice")
@RequiredArgsConstructor
public class IceController {

    private static final int MAXIMO_POR_MINUTO = 30;

    @Value("${app.ice.stun-urls:stun:stun.l.google.com:19302}")
    private String stunUrls;

    @Value("${app.ice.turn-urls:}")
    private String turnUrls;

    @Value("${app.ice.turn-username:}")
    private String turnUsername;

    @Value("${app.ice.turn-credential:}")
    private String turnCredential;

    private final LimitadorTaxa limitador;

    @GetMapping
    public ResponseEntity<?> servidores(HttpServletRequest http) {
        if (!limitador.permitir("ice:" + http.getRemoteAddr(), MAXIMO_POR_MINUTO, 60_000)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ResponseErro("Muitas requisições. Aguarde um minuto."));
        }

        List<Map<String, Object>> servidores = new ArrayList<>();

        List<String> stun = separar(stunUrls);
        if (!stun.isEmpty()) {
            servidores.add(Map.of("urls", stun));
        }

        List<String> turn = separar(turnUrls);
        if (!turn.isEmpty() && !turnUsername.isBlank() && !turnCredential.isBlank()) {
            servidores.add(Map.of("urls", turn, "username", turnUsername, "credential", turnCredential));
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of("iceServers", servidores));
    }

    private List<String> separar(String valor) {
        return Arrays.stream(valor.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
