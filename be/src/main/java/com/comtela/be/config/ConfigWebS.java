package com.comtela.be.config;

import com.comtela.be.seguranca.InterceptadorHandshake;
import com.comtela.be.seguranca.InterceptadorSeguranca;
import com.comtela.be.seguranca.LimitadorConexoesConcorrentes;
import com.comtela.be.seguranca.RegistroSessoes;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class ConfigWebS implements WebSocketMessageBrokerConfigurer {

    private static final int LIMITE_MENSAGEM_BYTES = 32 * 1024;
    private static final int LIMITE_BUFFER_ENVIO_BYTES = 512 * 1024;
    private static final int LIMITE_TEMPO_ENVIO_MS = 20_000;
    private static final long INTERVALO_HEARTBEAT_MS = 10_000;

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    private final InterceptadorSeguranca interceptadorSeguranca;
    private final InterceptadorHandshake interceptadorHandshake;
    private final RegistroSessoes registroSessoes;
    private final LimitadorConexoesConcorrentes limitadorConexoesConcorrentes;

    @Autowired
    @Lazy
    private TaskScheduler messageBrokerTaskScheduler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{INTERVALO_HEARTBEAT_MS, INTERVALO_HEARTBEAT_MS})
                .setTaskScheduler(messageBrokerTaskScheduler);
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(interceptadorSeguranca);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(LIMITE_MENSAGEM_BYTES)
                .setSendBufferSizeLimit(LIMITE_BUFFER_ENVIO_BYTES)
                .setSendTimeLimit(LIMITE_TEMPO_ENVIO_MS)
                .addDecoratorFactory(handler -> new WebSocketHandlerDecorator(handler) {
                    @Override
                    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                        registroSessoes.registrar(session);
                        super.afterConnectionEstablished(session);
                    }

                    @Override
                    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
                        registroSessoes.remover(session);
                        Object ip = session.getAttributes().get(InterceptadorHandshake.ATRIBUTO_IP);
                        if (ip instanceof String ipStr) {
                            limitadorConexoesConcorrentes.liberar(ipStr);
                        }
                        super.afterConnectionClosed(session, closeStatus);
                    }
                });
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/wsock")
                .setAllowedOriginPatterns(allowedOrigins)
                .setHandshakeHandler(new CustomHandshakeHandler())
                .addInterceptors(interceptadorHandshake)
                .withSockJS();
    }
}
