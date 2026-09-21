package com.comtela.be.controller;

import com.comtela.be.dto.ResponseErro;
import com.comtela.be.seguranca.LimitadorTaxa;
import com.comtela.be.seguranca.RegistroSessoes;
import com.comtela.be.service.SalaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final int TAMANHO_MINIMO_CHAVE = 16;
    private static final int MAXIMO_TENTATIVAS_POR_MINUTO = 10;
    private static final long ATRASO_FECHAMENTO_MS = 300;

    @Value("${app.admin.chave:}")
    private String chave;

    private final SalaService salaService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RegistroSessoes registroSessoes;
    private final LimitadorTaxa limitador;

    @PostMapping("/salas/{salaId}/encerrar")
    public ResponseEntity<?> encerrar(@PathVariable String salaId,
                                      @RequestHeader(value = "X-Admin-Chave", required = false) String chaveInformada,
                                      HttpServletRequest http) {
        if (chave == null || chave.length() < TAMANHO_MINIMO_CHAVE) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String ip = http.getRemoteAddr();
        if (!limitador.permitir("admin:" + ip, MAXIMO_TENTATIVAS_POR_MINUTO, 60_000)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ResponseErro("Muitas tentativas."));
        }

        boolean chaveConfere = chaveInformada != null
                && MessageDigest.isEqual(chaveInformada.getBytes(StandardCharsets.UTF_8), chave.getBytes(StandardCharsets.UTF_8));
        if (!chaveConfere) {
            log.warn("Uso da chave de administracao recusado (ip {})", ip);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ResponseErro("Chave inválida."));
        }

        List<String> participantes = salaService.encerrarSala(salaId);
        if (participantes == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseErro("Sala não encontrada."));
        }

        participantes.forEach(id -> messagingTemplate.convertAndSendToUser(id, "/queue/expulso", "encerrada"));
        CompletableFuture.runAsync(
                () -> participantes.forEach(registroSessoes::fechar),
                CompletableFuture.delayedExecutor(ATRASO_FECHAMENTO_MS, TimeUnit.MILLISECONDS));

        log.info("Sala {} encerrada pela administracao ({} participantes)", SalaService.normalizarId(salaId), participantes.size());
        return ResponseEntity.ok(Map.of("encerrada", true, "participantes", participantes.size()));
    }
}
