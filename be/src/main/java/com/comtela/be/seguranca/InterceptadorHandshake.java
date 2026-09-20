package com.comtela.be.seguranca;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class InterceptadorHandshake implements HandshakeInterceptor {

    private static final int MAXIMO_CONEXOES_POR_MINUTO = 40;

    private final LimitadorTaxa limitador;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String ip = request instanceof ServletServerHttpRequest servlet
                ? servlet.getServletRequest().getRemoteAddr()
                : "desconhecido";

        if (!limitador.permitir("conexao:" + ip, MAXIMO_CONEXOES_POR_MINUTO, 60_000)) {
            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            return false;
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
