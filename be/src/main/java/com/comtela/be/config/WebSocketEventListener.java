package com.comtela.be.config;

import com.comtela.be.dto.ResponseSala;
import com.comtela.be.service.SalaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SalaService salaService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void aoDesconectar(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());

        String salaId = (String) headerAccessor.getSessionAttributes().get("salaId");
        String integranteId = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;

        if (salaId == null || integranteId == null) {
            return;
        }

        log.info("Integrante {} desconectou da sala {}", integranteId, salaId);

        ResponseSala salaAtualizada = salaService.sair(salaId, integranteId);

        if (salaAtualizada != null) {
            messagingTemplate.convertAndSend(
                    "/topic/sala/" + salaId + "/participantes",
                    salaAtualizada
            );
        }
    }

}