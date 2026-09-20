package com.comtela.be.seguranca;

import com.comtela.be.service.SalaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class InterceptadorSeguranca implements ChannelInterceptor {

    private static final Pattern ASSINATURA_SALA = Pattern.compile("^/topic/sala/([^/]+)/(participantes|chat)$");
    private static final Pattern ENVIO_SALA =
            Pattern.compile("^/app/sala/([^/]+)/(entrar|chat|compartilhar|sinal|sincronizar|parar|expulsar)$");
    private static final Set<String> FILAS_USUARIO =
            Set.of("/user/queue/confirmacao", "/user/queue/sinal", "/user/queue/erro", "/user/queue/expulso");

    private static final int MAXIMO_ENVIOS_POR_JANELA = 400;
    private static final long JANELA_MS = 10_000;

    private final SalaService salaService;
    private final LimitadorTaxa limitador;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acessor = StompHeaderAccessor.wrap(message);
        StompCommand comando = acessor.getCommand();

        if (StompCommand.SUBSCRIBE.equals(comando)) {
            return permitirAssinatura(acessor) ? message : negar(acessor);
        }
        if (StompCommand.SEND.equals(comando)) {
            return permitirEnvio(acessor) ? message : negar(acessor);
        }
        return message;
    }

    private boolean permitirAssinatura(StompHeaderAccessor acessor) {
        String destino = acessor.getDestination();
        if (destino == null || acessor.getUser() == null) {
            return false;
        }
        if (FILAS_USUARIO.contains(destino)) {
            return true;
        }
        Matcher m = ASSINATURA_SALA.matcher(destino);
        return m.matches()
                && SalaService.ehIdCanonico(m.group(1))
                && salaService.pertence(m.group(1), acessor.getUser().getName());
    }

    private boolean permitirEnvio(StompHeaderAccessor acessor) {
        String destino = acessor.getDestination();
        if (destino == null || acessor.getUser() == null) {
            return false;
        }
        Matcher m = ENVIO_SALA.matcher(destino);
        if (!m.matches() || !SalaService.ehIdCanonico(m.group(1))) {
            return false;
        }
        return limitador.permitir("msg:" + acessor.getSessionId(), MAXIMO_ENVIOS_POR_JANELA, JANELA_MS);
    }

    private Message<?> negar(StompHeaderAccessor acessor) {
        log.warn("Operacao {} negada em {} (sessao {})", acessor.getCommand(), acessor.getDestination(), acessor.getSessionId());
        return null;
    }
}
