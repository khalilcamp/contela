package com.comtela.be.service;

import com.comtela.be.dto.ResponseIntegrante;
import com.comtela.be.dto.ResponseMensagem;
import com.comtela.be.dto.ResponseSala;
import com.comtela.be.dto.TipoMensagem;
import com.comtela.be.ent.Integrante;
import com.comtela.be.ent.Sala;
import com.comtela.be.seguranca.LimitadorTaxa;
import com.comtela.be.seguranca.SenhaSala;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalaService {

    private static final int TAMANHO_MAXIMO_MENSAGEM = 2000;
    private static final int TAMANHO_MAXIMO_URL_GIF = 500;
    private static final Set<String> HOSTS_GIF_PERMITIDOS = Set.of("giphy.com");
    private static final Set<String> CORES_PERMITIDAS =
            Set.of("#f97316", "#3b82f6", "#22c55e", "#ec4899", "#a855f7", "#2dd4bf");
    private static final Set<String> CHAPEUS_PERMITIDOS = Set.of("nenhum", "festa", "bone");
    private static final int TAMANHO_MAXIMO_NOME = 24;
    private static final int TAMANHO_MINIMO_SENHA = 4;
    private static final int TAMANHO_MAXIMO_SENHA = 64;
    private static final int MAXIMO_SALAS = 200;
    private static final int MAXIMO_PARTICIPANTES = 10;
    private static final Duration VALIDADE_SALA_SEM_USO = Duration.ofMinutes(2);
    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final Pattern ID_CANONICO = Pattern.compile("^[A-Z0-9]{4}-[A-Z0-9]{4}$");
    private static final Set<String> TIPOS_SINAL = Set.of("offer", "answer", "ice-candidate", "compartilhamento-parado");

    private final Map<String, Sala> salas = new ConcurrentHashMap<>();
    private final SecureRandom aleatorio = new SecureRandom();
    private final LimitadorTaxa limitador;

    public record SalaCriada(String id, String tokenDono) {
    }

    public static String normalizarId(String bruto) {
        if (bruto == null) {
            return "";
        }
        String limpo = bruto.toUpperCase().replaceAll("[^A-Z0-9]", "");
        return limpo.length() == 8 ? limpo.substring(0, 4) + "-" + limpo.substring(4) : limpo;
    }

    public static boolean ehIdCanonico(String id) {
        return id != null && ID_CANONICO.matcher(id).matches();
    }

    public SalaCriada criarSala(String senha) {
        String senhaValida = validarSenhaNova(senha);
        removerSalasSemUso();

        if (salas.size() >= MAXIMO_SALAS) {
            throw new IllegalStateException("Limite de salas atingido. Tente novamente em instantes.");
        }

        byte[] salt = null;
        byte[] hash = null;
        if (senhaValida != null) {
            salt = SenhaSala.gerarSalt();
            hash = SenhaSala.hash(senhaValida, salt);
        }

        String token = gerarToken();
        while (true) {
            String id = gerarIdSala();
            if (salas.putIfAbsent(id, new Sala(id, token, salt, hash)) == null) {
                return new SalaCriada(id, token);
            }
        }
    }

    public ResponseSala entrar(String salaId, String integranteId, String sessaoId,
                               String nomeBruto, String senha, String tokenDono) {
        return entrar(salaId, integranteId, sessaoId, nomeBruto, senha, tokenDono, null, null);
    }

    public ResponseSala entrar(String salaId, String integranteId, String sessaoId,
                               String nomeBruto, String senha, String tokenDono,
                               String cor, String chapeu) {
        Sala sala = buscar(salaId);
        String nome = validarNome(nomeBruto);
        String corValida = validarCor(cor);
        String chapeuValido = validarChapeu(chapeu);

        if (sala.temSenha()) {
            conferirSenha(sala, sessaoId, senha);
        }

        synchronized (sala) {
            if (salas.get(sala.getIdSala()) != sala) {
                throw new IllegalStateException("Sala não encontrada. Confira o código.");
            }
            if (sala.getParticipantes().size() >= MAXIMO_PARTICIPANTES) {
                throw new IllegalStateException("A sala está cheia.");
            }
            boolean nomeEmUso = sala.getParticipantes().values().stream()
                    .anyMatch(i -> i.getNome().equalsIgnoreCase(nome));
            if (nomeEmUso) {
                throw new IllegalArgumentException("Já existe alguém com esse nome na sala. Escolha outro.");
            }

            sala.getParticipantes().put(integranteId,
                    new Integrante(integranteId, sala.getIdSala(), nome, false, Instant.now(), corValida, chapeuValido));

            if (sala.getDonoId() == null && tokenConfere(sala, tokenDono)) {
                sala.setDonoId(integranteId);
            }
            return montarSalaResponse(sala);
        }
    }

    private String validarCor(String cor) {
        if (cor == null) return null;
        if (!CORES_PERMITIDAS.contains(cor)) {
            throw new IllegalArgumentException("Cor inválida.");
        }
        return cor;
    }

    private String validarChapeu(String chapeu) {
        if (chapeu == null) return null;
        if (!CHAPEUS_PERMITIDOS.contains(chapeu)) {
            throw new IllegalArgumentException("Chapéu inválido.");
        }
        return chapeu;
    }

    public ResponseSala sair(String salaId, String integranteId) {
        Sala sala = salas.get(salaId);
        if (sala == null) {
            return null;
        }

        synchronized (sala) {
            sala.getParticipantes().remove(integranteId);

            if (sala.getParticipantes().isEmpty()) {
                salas.remove(sala.getIdSala(), sala);
                return null;
            }
            if (integranteId.equals(sala.getDonoId())) {
                sala.setDonoId(participanteMaisAntigo(sala));
            }
            return montarSalaResponse(sala);
        }
    }

    public List<String> encerrarSala(String salaIdBruto) {
        Sala sala = salas.get(normalizarId(salaIdBruto));
        if (sala == null) {
            return null;
        }

        synchronized (sala) {
            List<String> participantes = new ArrayList<>(sala.getParticipantes().keySet());
            sala.getParticipantes().clear();
            salas.remove(sala.getIdSala(), sala);
            return participantes;
        }
    }

    public int pessoasOnline() {
        return salas.values().stream().mapToInt(s -> s.getParticipantes().size()).sum();
    }

    public boolean pertence(String salaId, String integranteId) {
        Sala sala = salas.get(salaId);
        return sala != null && integranteId != null && sala.getParticipantes().containsKey(integranteId);
    }

    public ResponseSala estado(String salaId, String integranteId) {
        return montarSalaResponse(exigirParticipante(salaId, integranteId));
    }

    public ResponseMensagem registrarMensagem(String salaId, String integranteId, String texto) {
        return registrarMensagem(salaId, integranteId, texto, TipoMensagem.TEXTO);
    }

    public ResponseMensagem registrarMensagem(String salaId, String integranteId, String texto, TipoMensagem tipo) {
        Sala sala = exigirSala(salaId);

        Integrante autor = sala.getParticipantes().get(integranteId);
        if (autor == null) {
            throw new IllegalStateException("Integrante não pertence à sala");
        }

        if (texto == null || texto.isBlank()) {
            throw new IllegalArgumentException("Mensagem vazia");
        }

        TipoMensagem tipoFinal = tipo != null ? tipo : TipoMensagem.TEXTO;
        if (tipoFinal == TipoMensagem.GIF) {
            validarUrlGif(texto);
        } else if (texto.length() > TAMANHO_MAXIMO_MENSAGEM) {
            throw new IllegalArgumentException("Mensagem excede o tamanho máximo de " + TAMANHO_MAXIMO_MENSAGEM + " caracteres");
        }

        if (!limitador.permitir("chat:" + integranteId, 8, 10_000)) {
            throw new IllegalStateException("Você está enviando mensagens rápido demais.");
        }

        return new ResponseMensagem(
                UUID.randomUUID().toString(),
                integranteId,
                autor.getNome(),
                texto,
                tipoFinal,
                Instant.now()
        );
    }

    private void validarUrlGif(String url) {
        if (url.length() > TAMANHO_MAXIMO_URL_GIF) {
            throw new IllegalArgumentException("Link do GIF é grande demais.");
        }

        URI uri;
        try {
            uri = new URI(url);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Link do GIF inválido.");
        }

        String host = uri.getHost();
        boolean hostPermitido = host != null && HOSTS_GIF_PERMITIDOS.stream()
                .anyMatch(permitido -> host.equals(permitido) || host.endsWith("." + permitido));
        if (!"https".equals(uri.getScheme()) || !hostPermitido) {
            throw new IllegalArgumentException("O GIF precisa vir do Giphy.");
        }
    }

    public ResponseSala atualizarCompartilhamento(String salaId, String integranteId, boolean compartilhando) {
        Sala sala = exigirParticipante(salaId, integranteId);

        synchronized (sala) {
            if (compartilhando) {
                boolean outroCompartilhando = sala.getParticipantes().values().stream()
                        .anyMatch(i -> i.isCompartilhandoTela() && !i.getId().equals(integranteId));
                if (outroCompartilhando) {
                    throw new IllegalStateException("Outra pessoa já está compartilhando a tela.");
                }
            }
            sala.getParticipantes().get(integranteId).setCompartilhandoTela(compartilhando);
            return montarSalaResponse(sala);
        }
    }

    public void validarSinal(String salaId, String remetenteId, String destinatarioId, String tipo) {
        if (tipo == null || !TIPOS_SINAL.contains(tipo)) {
            throw new IllegalArgumentException("Sinal inválido.");
        }
        if (!pertence(salaId, remetenteId) || !pertence(salaId, destinatarioId)) {
            throw new IllegalStateException("Destinatário não pertence à sala.");
        }
    }

    public ResponseSala pararCompartilhamentoDe(String salaId, String solicitanteId, String alvoId) {
        Sala sala = exigirDono(salaId, solicitanteId);

        synchronized (sala) {
            Integrante alvo = sala.getParticipantes().get(alvoId);
            if (alvo == null) {
                throw new IllegalStateException("Participante não encontrado.");
            }
            alvo.setCompartilhandoTela(false);
            return montarSalaResponse(sala);
        }
    }

    public ResponseSala removerComoDono(String salaId, String solicitanteId, String alvoId) {
        Sala sala = exigirDono(salaId, solicitanteId);

        if (solicitanteId.equals(alvoId)) {
            throw new IllegalArgumentException("Você não pode remover a si mesmo.");
        }

        synchronized (sala) {
            if (sala.getParticipantes().remove(alvoId) == null) {
                throw new IllegalStateException("Participante não encontrado.");
            }
            return montarSalaResponse(sala);
        }
    }

    private Sala buscar(String salaId) {
        Sala sala = salas.get(normalizarId(salaId));
        if (sala == null) {
            throw new IllegalStateException("Sala não encontrada. Confira o código.");
        }
        return sala;
    }

    private Sala exigirSala(String salaId) {
        Sala sala = salas.get(salaId);
        if (sala == null) {
            throw new IllegalStateException("Sala não encontrada: " + salaId);
        }
        return sala;
    }

    private Sala exigirParticipante(String salaId, String integranteId) {
        Sala sala = exigirSala(salaId);
        if (!sala.getParticipantes().containsKey(integranteId)) {
            throw new IllegalStateException("Integrante não pertence à sala");
        }
        return sala;
    }

    private Sala exigirDono(String salaId, String solicitanteId) {
        Sala sala = exigirParticipante(salaId, solicitanteId);
        if (!solicitanteId.equals(sala.getDonoId())) {
            throw new IllegalStateException("Apenas o anfitrião pode fazer isso.");
        }
        return sala;
    }

    private void conferirSenha(Sala sala, String sessaoId, String senha) {
        boolean dentroDoLimite = limitador.permitir("senha:sessao:" + sessaoId, 5, 60_000)
                && limitador.permitir("senha:sala:" + sala.getIdSala(), 60, 60_000);
        if (!dentroDoLimite) {
            throw new IllegalStateException("Muitas tentativas de senha. Aguarde um minuto.");
        }

        boolean correta = senha != null
                && senha.length() <= TAMANHO_MAXIMO_SENHA
                && MessageDigest.isEqual(SenhaSala.hash(senha, sala.getSenhaSalt()), sala.getSenhaHash());
        if (!correta) {
            throw new IllegalArgumentException("Senha incorreta.");
        }
    }

    private boolean tokenConfere(Sala sala, String token) {
        return token != null && MessageDigest.isEqual(token.getBytes(), sala.getTokenDono().getBytes());
    }

    private String validarNome(String bruto) {
        if (bruto == null || bruto.isBlank()) {
            throw new IllegalArgumentException("Informe seu nome.");
        }
        String nome = bruto.trim().replaceAll("\\s+", " ");
        if (nome.length() > TAMANHO_MAXIMO_NOME) {
            throw new IllegalArgumentException("O nome pode ter no máximo " + TAMANHO_MAXIMO_NOME + " caracteres.");
        }
        boolean invalido = nome.codePoints().anyMatch(c ->
                Character.isISOControl(c) || Character.getType(c) == Character.FORMAT);
        if (invalido) {
            throw new IllegalArgumentException("O nome contém caracteres inválidos.");
        }
        return nome;
    }

    private String validarSenhaNova(String senha) {
        if (senha == null || senha.isEmpty()) {
            return null;
        }
        if (senha.length() < TAMANHO_MINIMO_SENHA || senha.length() > TAMANHO_MAXIMO_SENHA) {
            throw new IllegalArgumentException(
                    "A senha deve ter entre " + TAMANHO_MINIMO_SENHA + " e " + TAMANHO_MAXIMO_SENHA + " caracteres.");
        }
        return senha;
    }

    private void removerSalasSemUso() {
        Instant limite = Instant.now().minus(VALIDADE_SALA_SEM_USO);
        salas.values().removeIf(s -> s.getParticipantes().isEmpty() && s.getCriadaEm().isBefore(limite));
    }

    private String participanteMaisAntigo(Sala sala) {
        return sala.getParticipantes().values().stream()
                .min(Comparator.comparing(Integrante::getEntrouEm))
                .map(Integrante::getId)
                .orElse(null);
    }

    private String gerarIdSala() {
        StringBuilder id = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            if (i == 4) {
                id.append('-');
            }
            id.append(ALFABETO.charAt(aleatorio.nextInt(ALFABETO.length())));
        }
        return id.toString();
    }

    private String gerarToken() {
        byte[] bytes = new byte[24];
        aleatorio.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private ResponseSala montarSalaResponse(Sala sala) {
        List<ResponseIntegrante> participantes = sala.getParticipantes().values().stream()
                .sorted(Comparator.comparing(Integrante::getEntrouEm))
                .map(i -> new ResponseIntegrante(i.getId(), i.getNome(), i.isCompartilhandoTela(), i.getCor(), i.getChapeu()))
                .collect(Collectors.toList());

        return new ResponseSala(sala.getIdSala(), participantes, sala.getDonoId());
    }

}
