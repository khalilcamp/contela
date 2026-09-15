package com.comtela.be.service;

import com.comtela.be.dto.ResponseIntegrante;
import com.comtela.be.dto.ResponseMensagem;
import com.comtela.be.dto.ResponseSala;
import com.comtela.be.ent.Integrante;
import com.comtela.be.ent.Mensagem;
import com.comtela.be.ent.Sala;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class SalaService {

    private static final int TAMANHO_MAXIMO_MENSAGEM = 2000;

    private final Map<String, Sala> salas = new ConcurrentHashMap<>();

    public Sala criarSalaSeNaoExistir(String salaId) {
        return salas.computeIfAbsent(salaId, Sala::new);
    }

    public ResponseSala entrar(String salaId, String integranteId, String nome) {
        Sala sala = criarSalaSeNaoExistir(salaId);

        Integrante integrante = new Integrante(integranteId, salaId, nome, false);
        sala.getParticipantes().put(integranteId, integrante);

        return montarSalaResponse(sala);
    }

    public ResponseSala sair(String salaId, String integranteId) {
        Sala sala = salas.get(salaId);
        if (sala == null) {
            return null;
        }

        sala.getParticipantes().remove(integranteId);

        if (sala.getParticipantes().isEmpty()) {
            salas.remove(salaId);
            return null;
        }

        return montarSalaResponse(sala);
    }

    public ResponseMensagem registrarMensagem(String salaId, String integranteId, String texto) {
        Sala sala = salas.get(salaId);
        if (sala == null) {
            throw new IllegalStateException("Sala não encontrada: " + salaId);
        }

        Integrante autor = sala.getParticipantes().get(integranteId);
        if (autor == null) {
            throw new IllegalStateException("Integrante não pertence à sala");
        }

        if (texto == null || texto.isBlank()) {
            throw new IllegalArgumentException("Mensagem vazia");
        }

        if (texto.length() > TAMANHO_MAXIMO_MENSAGEM) {
            throw new IllegalArgumentException("Mensagem excede o tamanho máximo de " + TAMANHO_MAXIMO_MENSAGEM + " caracteres");
        }

        Mensagem mensagem = new Mensagem(
                UUID.randomUUID().toString(),
                salaId,
                integranteId,
                autor.getNome(),
                texto,
                Instant.now()
        );

        return new ResponseMensagem(
                mensagem.getId(),
                mensagem.getIntegranteId(),
                mensagem.getNomeMembro(),
                mensagem.getTexto(),
                mensagem.getEnviadaEm()
        );
    }

    public ResponseSala atualizarCompartilhamento(String salaId, String integranteId, boolean compartilhando) {
        Sala sala = salas.get(salaId);
        if (sala == null) {
            throw new IllegalStateException("Sala não encontrada: " + salaId);
        }

        Integrante integrante = sala.getParticipantes().get(integranteId);
        if (integrante == null) {
            throw new IllegalStateException("Integrante não pertence à sala");
        }

        if (compartilhando) {
            sala.getParticipantes().values().forEach(i -> i.setCompartilhandoTela(false));
        }

        integrante.setCompartilhandoTela(compartilhando);

        return montarSalaResponse(sala);
    }

    private ResponseSala montarSalaResponse(Sala sala) {
        List<ResponseIntegrante> participantes = sala.getParticipantes().values().stream()
                .map(i -> new ResponseIntegrante(i.getId(), i.getNome(), i.isCompartilhandoTela()))
                .collect(Collectors.toList());

        return new ResponseSala(sala.getIdSala(), participantes);
    }

}
