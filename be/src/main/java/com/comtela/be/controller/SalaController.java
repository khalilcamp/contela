package com.comtela.be.controller;

import com.comtela.be.dto.*;
import com.comtela.be.seguranca.RegistroSessoes;
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
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Controller
@RequiredArgsConstructor
public class SalaController {

    private static final long ATRASO_FECHAMENTO_MS = 300;

    private final SalaService salaService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RegistroSessoes registroSessoes;

    @MessageMapping("/sala/{salaId}/entrar")
    @SendTo("/topic/sala/{salaId}/participantes")
    public ResponseSala entrar(@DestinationVariable String salaId,
                               @Payload RequestEntrarSala request,
                               SimpMessageHeaderAccessor headerAccessor) {
        Map<String, Object> sessao = headerAccessor.getSessionAttributes();
        if (sessao.get("salaId") != null) {
            throw new IllegalStateException("Você já está em uma sala.");
        }
        if (request == null) {
            throw new IllegalArgumentException("Informe seu nome.");
        }

        String integranteId = headerAccessor.getUser().getName();
        ResponseSala salaResponse = salaService.entrar(
                salaId, integranteId, headerAccessor.getSessionId(),
                request.getNome(), request.getSenha(), request.getTokenDono());

        sessao.put("salaId", salaResponse.getSalaId());
        messagingTemplate.convertAndSendToUser(integranteId, "/queue/confirmacao",
                new ConfirmacaoEntrada(integranteId, salaResponse.getSalaId()));

        return salaResponse;
    }

    @MessageMapping("/sala/{salaId}/sincronizar")
    @SendTo("/topic/sala/{salaId}/participantes")
    public ResponseSala sincronizar(@DestinationVariable String salaId, SimpMessageHeaderAccessor headerAccessor) {
        return salaService.estado(salaId, headerAccessor.getUser().getName());
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
        salaService.validarSinal(salaId, remetenteId, sinal.getDestinatarioId(), sinal.getTipo());
        sinal.setRemetenteId(remetenteId);

        messagingTemplate.convertAndSendToUser(
                sinal.getDestinatarioId(),
                "/queue/sinal",
                sinal
        );
    }

    @MessageMapping("/sala/{salaId}/parar")
    @SendTo("/topic/sala/{salaId}/participantes")
    public ResponseSala pararCompartilhamentoDeOutro(@DestinationVariable String salaId,
                                                     @Payload RequestAcao request,
                                                     SimpMessageHeaderAccessor headerAccessor) {
        String solicitanteId = headerAccessor.getUser().getName();
        return salaService.pararCompartilhamentoDe(salaId, solicitanteId, request.getAlvoId());
    }

    @MessageMapping("/sala/{salaId}/expulsar")
    public void expulsar(@DestinationVariable String salaId,
                         @Payload RequestAcao request,
                         SimpMessageHeaderAccessor headerAccessor) {
        String solicitanteId = headerAccessor.getUser().getName();
        String alvoId = request.getAlvoId();

        ResponseSala salaAtualizada = salaService.removerComoDono(salaId, solicitanteId, alvoId);

        messagingTemplate.convertAndSendToUser(alvoId, "/queue/expulso", "removido");
        messagingTemplate.convertAndSend("/topic/sala/" + salaId + "/participantes", salaAtualizada);

        CompletableFuture.runAsync(
                () -> registroSessoes.fechar(alvoId),
                CompletableFuture.delayedExecutor(ATRASO_FECHAMENTO_MS, TimeUnit.MILLISECONDS));
    }

    @MessageExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public void tratarErro(RuntimeException ex, Principal principal) {
        if (principal == null) {
            return;
        }

        messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/erro", ex.getMessage());
    }

}
