package com.comtela.be.controller;

import com.comtela.be.dto.*;
import com.comtela.be.service.SalaService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class SalaController {

    private final SalaService salaService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/sala/{salaId}/entrar")
    @SendTo("/topic/sala/{salaId}/participantes")
    public ResponseSala entrar(@DestinationVariable String salaId,
                               @Payload RequestEntrarSala request,
                               SimpMessageHeaderAccessor headerAccessor) {
        String integranteId = headerAccessor.getUser().getName();
        headerAccessor.getSessionAttributes().put("salaId", salaId);
        headerAccessor.getSessionAttributes().put("nome", request.getNome());
        ResponseSala salaResponse = salaService.entrar(salaId, integranteId, request.getNome());
        messagingTemplate.convertAndSendToUser(integranteId, "/queue/confirmacao", new ConfirmacaoEntrada(integranteId));

        return salaResponse;
    }

    @MessageMapping("/sala/{salaId}/chat")
    @SendTo("/topic/sala/{salaId}/chat")
    public ResponseMensagem chat(@DestinationVariable String salaId,
                                 @Payload RequestMensagem request,
                                 SimpMessageHeaderAccessor headerAccessor) {

        String integranteId = headerAccessor.getUser().getName();
        return salaService.registrarMensagem(salaId, integranteId, request.getTexto());
    }

    @MessageMapping("/sala/{salaId}/compartilhar")
    @SendTo("/topic/sala/{salaId}/participantes")
    public ResponseSala compartilhar(@DestinationVariable String salaId,
                                     @Payload boolean compartilhando,
                                     SimpMessageHeaderAccessor headerAccessor) {

        String integranteId = headerAccessor.getUser().getName();
        return salaService.atualizarCompartilhamento(salaId, integranteId, compartilhando);
    }

    @MessageMapping("/sala/{salaId}/sinal")
    public void sinal(@DestinationVariable String salaId,
                      @Payload SinalWebRTC sinal,
                      SimpMessageHeaderAccessor headerAccessor) {

        String remetenteId = headerAccessor.getUser().getName();
        sinal.setRemetenteId(remetenteId);

        messagingTemplate.convertAndSendToUser(
                sinal.getDestinatarioId(),
                "/queue/sinal",
                sinal
        );
    }

    @MessageExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public void tratarErro(RuntimeException ex, Principal principal) {
        if (principal == null) {
            return;
        }

        messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/erro", ex.getMessage());
    }

}