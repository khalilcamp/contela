package com.comtela.be.seguranca;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RegistroSessoes {

    private final Map<String, WebSocketSession> sessoes = new ConcurrentHashMap<>();

    public void registrar(WebSocketSession sessao) {
        Principal principal = sessao.getPrincipal();
        if (principal != null) {
            sessoes.put(principal.getName(), sessao);
        }
    }

    public void remover(WebSocketSession sessao) {
        Principal principal = sessao.getPrincipal();
        if (principal != null) {
            sessoes.remove(principal.getName());
        }
    }

    public void fechar(String integranteId) {
        WebSocketSession sessao = sessoes.get(integranteId);
        if (sessao == null) {
            return;
        }
        try {
            sessao.close(CloseStatus.POLICY_VIOLATION);
        } catch (IOException ignorada) {
        }
    }
}
