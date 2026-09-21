<h1 align="center">Contela · Backend</h1>

<p align="center">
  Servidor de sinalização WebRTC e broadcast de chat para o Contela.
</p>

<p align="center">
  <a href="#stack">Stack</a> ·
  <a href="#como-funciona">Como funciona</a> ·
  <a href="#rodando-localmente">Rodando localmente</a> ·
  <a href="#estrutura-do-projeto">Estrutura</a> ·
  <a href="#deploy">Deploy</a>
</p>

---

Este é o backend do Contela: um servidor Spring Boot que fala STOMP sobre WebSocket. Ele não transmite vídeo — apenas coordena quem está em cada sala, retransmite mensagens de chat, e faz a ponte de sinalização WebRTC (offer/answer/ICE) entre os navegadores, que então trocam a tela compartilhada diretamente entre si (P2P).

O frontend (Next.js) que consome esse servidor vive em [`../contela-fe`](../contela-fe).

## Stack

- **Java 17** + **[Spring Boot 4.1](https://spring.io/projects/spring-boot)**
- **Spring WebSocket** (STOMP sobre SockJS)
- **Lombok**
- **Maven**

## Como funciona

Estado das salas fica em memória (`Map<String, Sala>`), sem banco de dados — cada sala existe enquanto tiver pelo menos uma pessoa dentro.

| Destino STOMP | O que faz |
| --- | --- |
| `/app/sala/{salaId}/entrar` | Entra na sala; confirma o id do participante de volta só pra ele |
| `/app/sala/{salaId}/chat` | Registra e retransmite uma mensagem pra todos na sala |
| `/app/sala/{salaId}/compartilhar` | Marca quem está compartilhando a tela (só um por vez) |
| `/app/sala/{salaId}/sinal` | Repassa offer/answer/ICE do WebRTC de um participante pro outro |

| Tópico assinado pelo cliente | Conteúdo |
| --- | --- |
| `/topic/sala/{salaId}/participantes` | Lista atualizada de quem está na sala |
| `/topic/sala/{salaId}/chat` | Novas mensagens |
| `/user/queue/sinal` | Sinalização WebRTC endereçada só a este participante |
| `/user/queue/confirmacao` | Confirmação de entrada, com o id gerado pro participante |

## Rodando localmente

Pré-requisito: JDK 17+.

```bash
./mvnw spring-boot:run
```

Sobe em `http://localhost:8080`, com o endpoint STOMP em `/wsock`. Espera o [frontend](../contela-fe) rodando em `http://localhost:3000` (único `origin` liberado por padrão — ajustável em `app.cors.allowed-origins`).

## Estrutura do projeto

```
src/main/java/com/comtela/be/
├── config/       WebSocket/STOMP, CORS, identificação de cada conexão
├── controller/   endpoints STOMP (SalaController)
├── service/      regras de negócio das salas (SalaService)
├── ent/          estado em memória (Sala, Integrante, Mensagem)
└── dto/          payloads trocados com o frontend
```

## Deploy

Antes de subir em produção (ex: [Render](https://render.com)):

- A origem liberada no CORS é configurável via `app.cors.allowed-origins` (variável de ambiente `APP_CORS_ALLOWED_ORIGINS`): coloque o domínio real do front publicado e `app://contela` para o app desktop, separados por vírgula. Origens de rede local (LAN, VPN) ficam no profile `dev`.
- O frontend precisa ser construído com `NEXT_PUBLIC_WS_URL` apontando para a URL pública deste backend (ex: `https://seu-backend.onrender.com/wsock`).
- A porta vem da variável `PORT` (padrão `8080`). Há um `Dockerfile` na pasta.
- Para a transmissão funcionar entre redes diferentes, configure um servidor TURN: `APP_ICE_TURN_URLS` (separadas por vírgula), `APP_ICE_TURN_USERNAME` e `APP_ICE_TURN_CREDENTIAL`. O front busca a configuração em `GET /api/ice`.

## Encerrar uma sala denunciada

Existe um endpoint de administração que derruba todos os participantes de **uma** sala e a apaga. As outras salas não são afetadas. Ele fica desligado até você definir a variável de ambiente `APP_ADMIN_CHAVE` com uma chave de pelo menos 16 caracteres (guarde-a só no painel do Render, nunca no repositório).

```
curl.exe -X POST https://seu-backend.onrender.com/api/admin/salas/ABCD-1234/encerrar -H "X-Admin-Chave: SUA_CHAVE"
```

- `200`: sala encerrada, com a quantidade de participantes derrubados. Quem estava nela vê o aviso "Esta sala foi encerrada pela administração do Contela".
- `404`: sala não encontrada (código errado ou sala já vazia). Também é o retorno quando a chave de administração não está configurada.
- `403`: chave inválida. Há limite de 10 tentativas por minuto por IP (`429`).

Fechar a sala não impede a criação de outra com um código novo, porque o Contela não tem contas. Não há como banir uma pessoa.
