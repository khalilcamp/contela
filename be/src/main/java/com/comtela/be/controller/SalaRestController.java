package com.comtela.be.controller;

import com.comtela.be.dto.RequestCriarSala;
import com.comtela.be.dto.ResponseErro;
import com.comtela.be.dto.ResponseSalaCriada;
import com.comtela.be.seguranca.LimitadorTaxa;
import com.comtela.be.service.SalaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/salas")
@RequiredArgsConstructor
public class SalaRestController {

    private static final int MAXIMO_CRIACOES_POR_MINUTO = 5;

    private final SalaService salaService;
    private final LimitadorTaxa limitador;

    @PostMapping
    public ResponseEntity<ResponseSalaCriada> criar(@RequestBody(required = false) RequestCriarSala request,
                                                    HttpServletRequest http) {
        if (!limitador.permitir("criar:" + http.getRemoteAddr(), MAXIMO_CRIACOES_POR_MINUTO, 60_000)) {
            throw new LimiteExcedidoException("Muitas salas criadas. Aguarde um minuto.");
        }

        String senha = request != null ? request.getSenha() : null;
        SalaService.SalaCriada criada = salaService.criarSala(senha);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ResponseSalaCriada(criada.id(), criada.tokenDono()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseErro> entradaInvalida(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseErro(ex.getMessage()));
    }

    @ExceptionHandler(LimiteExcedidoException.class)
    public ResponseEntity<ResponseErro> limiteExcedido(LimiteExcedidoException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ResponseErro(ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ResponseErro> indisponivel(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ResponseErro(ex.getMessage()));
    }

    static class LimiteExcedidoException extends RuntimeException {
        LimiteExcedidoException(String mensagem) {
            super(mensagem);
        }
    }
}
