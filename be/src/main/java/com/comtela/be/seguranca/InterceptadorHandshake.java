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
    public static final String ATRIBUTO_IP = "ipConexao";

    private final LimitadorTaxa limitador;
    private final LimitadorConexoesConcorrentes limitadorConcorrentes;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String ip = obterIp(request);

        if (!limitador.permitir("conexao:" + ip, MAXIMO_CONEXOES_POR_MINUTO, 60_000)) {
            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            return false;
        }
        if (!limitadorConcorrentes.tentarRegistrar(ip)) {
            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            return false;
        }
        attributes.put(ATRIBUTO_IP, ip);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            limitadorConcorrentes.liberar(obterIp(request));
        }
    }

    private String obterIp(ServerHttpRequest request) {
        return request instanceof ServletServerHttpRequest servlet
                ? servlet.getServletRequest().getRemoteAddr()
                : "desconhecido";
    }
}
