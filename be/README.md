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

O frontend (Next.js) que consome esse servidor vive em [`../frontend`](../frontend).

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

Sobe em `http://localhost:8080`, com o endpoint STOMP em `/wsock`. Espera o [frontend](../frontend) rodando em `http://localhost:3000` (único `origin` liberado por padrão — ajustável em `app.cors.allowed-origins`).

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

- A origem liberada no CORS já é configurável via `app.cors.allowed-origins` em `application.properties` (ou variável de ambiente `APP_CORS_ALLOWED_ORIGINS`) — só trocar pelo domínio real do frontend publicado (aceita múltiplas origens separadas por vírgula).
- O frontend também precisa apontar `WS_URL` pra URL pública deste backend em vez de `localhost:8080`.
