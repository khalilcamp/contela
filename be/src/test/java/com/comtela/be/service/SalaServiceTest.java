package com.comtela.be.service;

import com.comtela.be.dto.ResponseIntegrante;
import com.comtela.be.dto.ResponseSala;
import com.comtela.be.seguranca.LimitadorTaxa;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SalaServiceTest {

    private SalaService service;

    @BeforeEach
    void preparar() {
        service = new SalaService(new LimitadorTaxa());
    }

    private String novaSala() {
        return service.criarSala(null).id();
    }

    private ResponseSala entrar(String sala, String id, String nome) {
        return service.entrar(sala, id, "sessao-" + id, nome, null, null);
    }

    private boolean compartilhando(ResponseSala sala, String id) {
        return sala.getParticipantes().stream().filter(p -> p.getId().equals(id)).findFirst()
                .map(ResponseIntegrante::isCompartilhando).orElseThrow();
    }

    @Test
    void criaSalaComCodigoNoFormatoEsperadoETokenDoDono() {
        SalaService.SalaCriada criada = service.criarSala(null);

        assertTrue(SalaService.ehIdCanonico(criada.id()), criada.id());
        assertNotNull(criada.tokenDono());
        assertNotEquals(criada.id(), service.criarSala(null).id());
    }

    @Test
    void recusaSenhaDeSalaForaDoTamanhoPermitido() {
        assertThrows(IllegalArgumentException.class, () -> service.criarSala("abc"));
        assertThrows(IllegalArgumentException.class, () -> service.criarSala("x".repeat(65)));
    }

    @Test
    void normalizaOCodigoDaSala() {
        assertEquals("ABCD-EFGH", SalaService.normalizarId("abcd efgh"));
        assertEquals("ABCD-EFGH", SalaService.normalizarId("  abcd-efgh "));
        assertFalse(SalaService.ehIdCanonico("abcd-efgh"));
    }

    @Test
    void naoEntraEmSalaInexistente() {
        assertThrows(IllegalStateException.class, () -> entrar("ZZZZ-ZZZZ", "a", "Ana"));
    }

    private static final char INVERSAO_BIDI = (char) 0x202E;
    private static final char CONTROLE_BEL = (char) 0x07;

    @Test
    void validaONomeDoParticipante() {
        String sala = novaSala();

        assertThrows(IllegalArgumentException.class, () -> entrar(sala, "a", "  "));
        assertThrows(IllegalArgumentException.class, () -> entrar(sala, "a", "x".repeat(25)));
        assertThrows(IllegalArgumentException.class, () -> entrar(sala, "a", "Ana" + INVERSAO_BIDI + "evil"));
        assertThrows(IllegalArgumentException.class, () -> entrar(sala, "a", "An" + CONTROLE_BEL + "a"));
    }

    @Test
    void removeEspacosECaracteresDeControleDasPontasDoNome() {
        String sala = novaSala();

        ResponseSala resposta = entrar(sala, "a", "  Ana" + CONTROLE_BEL + "  ");

        assertEquals("Ana", resposta.getParticipantes().get(0).getNome());
    }

    @Test
    void naoPermiteNomeRepetidoIgnorandoMaiusculas() {
        String sala = novaSala();
        entrar(sala, "a", "Ana");

        assertThrows(IllegalArgumentException.class, () -> entrar(sala, "b", "ANA"));
    }

    @Test
    void soQuemTemOTokenViraDono() {
        SalaService.SalaCriada criada = service.criarSala(null);

        ResponseSala comoIntruso = entrar(criada.id(), "intruso", "Intruso");
        assertNull(comoIntruso.getDonoId());

        ResponseSala comoDono = service.entrar(criada.id(), "dono", "s-dono", "Dono", null, criada.tokenDono());
        assertEquals("dono", comoDono.getDonoId());
    }

    @Test
    void salaComSenhaExigeASenhaCorreta() {
        SalaService.SalaCriada criada = service.criarSala("segredo1");

        assertThrows(IllegalArgumentException.class, () -> service.entrar(criada.id(), "a", "s1", "Ana", null, null));
        assertThrows(IllegalArgumentException.class, () -> service.entrar(criada.id(), "a", "s1", "Ana", "errada", null));
        assertNotNull(service.entrar(criada.id(), "a", "s1", "Ana", "segredo1", null));
    }

    @Test
    void limitaTentativasDeSenhaPorSessao() {
        SalaService.SalaCriada criada = service.criarSala("segredo1");

        for (int i = 0; i < 5; i++) {
            assertThrows(IllegalArgumentException.class,
                    () -> service.entrar(criada.id(), "a", "mesma-sessao", "Ana", "errada", null));
        }
        IllegalStateException bloqueio = assertThrows(IllegalStateException.class,
                () -> service.entrar(criada.id(), "a", "mesma-sessao", "Ana", "segredo1", null));
        assertTrue(bloqueio.getMessage().contains("tentativas"));
    }

    @Test
    void salaCheiaRecusaOParticipanteExcedente() {
        String sala = novaSala();
        for (int i = 0; i < 10; i++) {
            entrar(sala, "id" + i, "Pessoa" + i);
        }

        IllegalStateException erro = assertThrows(IllegalStateException.class, () -> entrar(sala, "extra", "Extra"));
        assertTrue(erro.getMessage().contains("cheia"));
    }

    @Test
    void quandoODonoSaiOMaisAntigoAssume() throws InterruptedException {
        SalaService.SalaCriada criada = service.criarSala(null);
        service.entrar(criada.id(), "dono", "s1", "Dono", null, criada.tokenDono());
        Thread.sleep(5);
        entrar(criada.id(), "segundo", "Segundo");
        Thread.sleep(5);
        entrar(criada.id(), "terceiro", "Terceiro");

        ResponseSala depois = service.sair(criada.id(), "dono");

        assertEquals("segundo", depois.getDonoId());
    }

    @Test
    void salaVaziaEApagada() {
        String sala = novaSala();
        entrar(sala, "a", "Ana");

        assertNull(service.sair(sala, "a"));
        assertThrows(IllegalStateException.class, () -> entrar(sala, "b", "Bia"));
    }

    @Test
    void soUmaPessoaPorVezPodeCompartilhar() {
        String sala = novaSala();
        entrar(sala, "a", "Ana");
        entrar(sala, "b", "Bia");

        ResponseSala comAna = service.atualizarCompartilhamento(sala, "a", true);
        assertTrue(compartilhando(comAna, "a"));

        assertThrows(IllegalStateException.class, () -> service.atualizarCompartilhamento(sala, "b", true));

        service.atualizarCompartilhamento(sala, "a", false);
        ResponseSala comBia = service.atualizarCompartilhamento(sala, "b", true);
        assertTrue(compartilhando(comBia, "b"));
        assertFalse(compartilhando(comBia, "a"));
    }

    @Test
    void naoCompartilhaQuemNaoEstaNaSala() {
        String sala = novaSala();
        entrar(sala, "a", "Ana");

        assertThrows(IllegalStateException.class, () -> service.atualizarCompartilhamento(sala, "intruso", true));
    }

    @Test
    void sinalSoCirculaEntreMembrosComTipoValido() {
        String sala = novaSala();
        String outraSala = novaSala();
        entrar(sala, "a", "Ana");
        entrar(sala, "b", "Bia");
        entrar(outraSala, "c", "Caio");

        service.validarSinal(sala, "a", "b", "offer");
        service.validarSinal(sala, "a", "b", "ice-candidate");

        assertThrows(IllegalArgumentException.class, () -> service.validarSinal(sala, "a", "b", "explodir"));
        assertThrows(IllegalArgumentException.class, () -> service.validarSinal(sala, "a", "b", null));
        assertThrows(IllegalStateException.class, () -> service.validarSinal(sala, "a", "c", "offer"));
        assertThrows(IllegalStateException.class, () -> service.validarSinal(sala, "intruso", "b", "offer"));
    }

    @Test
    void soODonoPodeRemoverOuPararOCompartilhamentoDeOutro() {
        SalaService.SalaCriada criada = service.criarSala(null);
        service.entrar(criada.id(), "dono", "s1", "Dono", null, criada.tokenDono());
        entrar(criada.id(), "b", "Bia");
        entrar(criada.id(), "c", "Caio");
        service.atualizarCompartilhamento(criada.id(), "b", true);

        assertThrows(IllegalStateException.class, () -> service.pararCompartilhamentoDe(criada.id(), "c", "b"));
        assertThrows(IllegalStateException.class, () -> service.removerComoDono(criada.id(), "c", "b"));

        ResponseSala parado = service.pararCompartilhamentoDe(criada.id(), "dono", "b");
        assertFalse(compartilhando(parado, "b"));

        ResponseSala semBia = service.removerComoDono(criada.id(), "dono", "b");
        assertEquals(2, semBia.getParticipantes().size());
        assertThrows(IllegalArgumentException.class, () -> service.removerComoDono(criada.id(), "dono", "dono"));
    }

    @Test
    void encerrarSalaDerrubaTodosEApagaASala() {
        String sala = novaSala();
        String outra = novaSala();
        entrar(sala, "a", "Ana");
        entrar(sala, "b", "Bia");
        entrar(outra, "c", "Caio");

        List<String> derrubados = service.encerrarSala(sala.toLowerCase());

        assertEquals(2, derrubados.size());
        assertTrue(derrubados.containsAll(List.of("a", "b")));
        assertThrows(IllegalStateException.class, () -> entrar(sala, "d", "Duda"));
        assertTrue(service.pertence(outra, "c"));
        assertNull(service.encerrarSala("ZZZZ-ZZZZ"));
    }

    @Test
    void chatRecusaMensagemVaziaLongaOuEmRajada() {
        String sala = novaSala();
        entrar(sala, "a", "Ana");

        assertThrows(IllegalArgumentException.class, () -> service.registrarMensagem(sala, "a", " "));
        assertThrows(IllegalArgumentException.class, () -> service.registrarMensagem(sala, "a", "x".repeat(2001)));
        assertThrows(IllegalStateException.class, () -> service.registrarMensagem(sala, "intruso", "oi"));

        for (int i = 0; i < 8; i++) {
            assertNotNull(service.registrarMensagem(sala, "a", "mensagem " + i));
        }
        assertThrows(IllegalStateException.class, () -> service.registrarMensagem(sala, "a", "mensagem 9"));
    }
}
