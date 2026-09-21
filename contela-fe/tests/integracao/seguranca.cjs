const { Client } = require('@stomp/stompjs');
const SockJS = require('sockjs-client');
const BASE = process.env.BASE_URL || 'http://localhost:8090';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, falhas = 0;
const checar = (nome, cond, detalhe = '') => {
    cond ? ok++ : falhas++;
    console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (detalhe ? '  -> ' + detalhe : ''));
};

async function criarSala(senha) {
    const r = await fetch(BASE + '/api/salas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(senha ? { senha } : {}) });
    return r.json();
}

function conectar(rotulo) {
    return new Promise((res) => {
        const s = { rotulo, erro: [], sinal: [], conf: null, part: null, chat: [], expulso: false, fechado: false };
        const c = new Client({ webSocketFactory: () => new SockJS(BASE + '/wsock'), reconnectDelay: 0 });
        c.onWebSocketClose = () => (s.fechado = true);
        c.onConnect = () => {
            c.subscribe('/user/queue/confirmacao', (m) => (s.conf = JSON.parse(m.body)));
            c.subscribe('/user/queue/sinal', (m) => s.sinal.push(JSON.parse(m.body)));
            c.subscribe('/user/queue/erro', (m) => s.erro.push(m.body));
            c.subscribe('/user/queue/expulso', () => (s.expulso = true));
            s.c = c;
            res(s);
        };
        c.activate();
    });
}

async function entrar(s, sala, nome, extra = {}) {
    const jaEntrou = !!s.meuId;
    s.erro.length = 0;
    if (!jaEntrou) s.conf = null;
    s.c.publish({ destination: '/app/sala/' + sala + '/entrar', body: JSON.stringify({ nome, ...extra }) });
    for (let i = 0; i < 20 && (jaEntrou ? !s.erro.length : !s.conf && !s.erro.length); i++) await sleep(60);
    if (!jaEntrou && s.conf) {
        s.meuId = s.conf.meuId;
        s.c.subscribe('/topic/sala/' + sala + '/participantes', (m) => (s.part = JSON.parse(m.body)));
        s.c.subscribe('/topic/sala/' + sala + '/chat', (m) => s.chat.push(JSON.parse(m.body)));
        s.c.publish({ destination: '/app/sala/' + sala + '/sincronizar', body: '' });
        await sleep(250);
    }
    return s;
}
const pub = (s, dest, corpo) => s.c.publish({ destination: dest, body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo) });

(async () => {
    console.log('--- Criacao de sala e entrada');
    const { id: R, tokenDono } = await criarSala('segredo1');
    checar('codigo gerado no formato XXXX-XXXX', /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(R), R);

    const A = await conectar('A');
    await entrar(A, 'ZZZZ-ZZZZ', 'A');
    checar('entrar em sala inexistente e recusado', !A.conf && A.erro.length > 0, A.erro[0]);

    await entrar(A, R, 'A', { tokenDono });
    checar('sem senha e recusado', !A.conf && /Senha/.test(A.erro[0] || ''), A.erro[0]);

    await entrar(A, R, 'A', { senha: 'errada', tokenDono });
    checar('senha errada e recusada', !A.conf && /Senha/.test(A.erro[0] || ''), A.erro[0]);

    await entrar(A, R, 'A\u202Eevil', { senha: 'segredo1', tokenDono });
    checar('nome com caractere de controle bidi e recusado', !A.conf, A.erro[0]);
    await entrar(A, R, 'x'.repeat(40), { senha: 'segredo1', tokenDono });
    checar('nome longo demais e recusado', !A.conf, A.erro[0]);

    await entrar(A, R, 'Anfitriao', { senha: 'segredo1', tokenDono });
    checar('senha correta + token entra como dono', !!A.conf && A.part?.donoId === A.meuId, 'donoId=' + (A.part?.donoId || '').slice(0, 8));

    await entrar(A, R, 'Outro', { senha: 'segredo1' });
    checar('segunda entrada na mesma sessao e recusada', /já está em uma sala/.test(A.erro[0] || ''), A.erro[0]);

    const B = await conectar('B');
    await entrar(B, R, 'anfitriao', { senha: 'segredo1' });
    checar('nome duplicado (ignorando maiusculas) e recusado', !B.conf && /nome/.test(B.erro[0] || ''), B.erro[0]);
    await entrar(B, R, 'Bruno', { senha: 'segredo1' });
    checar('segundo participante entra', !!B.conf);
    checar('segundo participante nao e dono', B.part?.donoId === A.meuId);

    console.log('--- Espionagem e forja de mensagens');
    const E = await conectar('E');
    E.c.subscribe(`/topic/sala/${R}/chat`, (m) => E.chat.push(JSON.parse(m.body)));
    E.c.subscribe(`/topic/sala/${R}/participantes`, (m) => (E.part = JSON.parse(m.body)));
    E.c.subscribe('/topic/sala/*/chat', (m) => E.chat.push(JSON.parse(m.body)));
    E.c.subscribe('/topic/sala/**', (m) => E.chat.push(JSON.parse(m.body)));
    await sleep(300);
    pub(A, `/app/sala/${R}/chat`, { texto: 'mensagem privada' });
    await sleep(400);
    checar('membro recebe o chat', B.chat.some((m) => m.texto === 'mensagem privada'));
    checar('espiao (nunca entrou) NAO recebe chat', E.chat.length === 0 && E.part === null);

    pub(E, `/topic/sala/${R}/chat`, { id: 'x', integranteId: A.meuId, nomeIntegrante: 'Anfitriao', texto: 'FORJADA', enviadaEm: new Date().toISOString() });
    pub(E, `/topic/sala/${R}/participantes`, { salaId: R, participantes: [], donoId: null });
    await sleep(400);
    checar('mensagem forjada direto no /topic NAO chega aos membros', !B.chat.some((m) => m.texto === 'FORJADA'));
    checar('lista de participantes forjada NAO chega aos membros', B.part?.participantes.length === 2);

    console.log('--- Sinais WebRTC');
    const M = await conectar('M');
    pub(M, `/app/sala/${R}/sinal`, { tipo: 'offer', destinatarioId: B.meuId, payload: { x: 1 } });
    await sleep(400);
    checar('sinal de quem nao esta na sala NAO chega', B.sinal.length === 0);

    pub(A, `/app/sala/${R}/sinal`, { tipo: 'offer', destinatarioId: B.meuId, payload: { x: 1 } });
    await sleep(400);
    checar('sinal entre membros chega, com remetente correto', B.sinal.length === 1 && B.sinal[0].remetenteId === A.meuId);

    pub(A, `/app/sala/${R}/sinal`, { tipo: 'explodir', destinatarioId: B.meuId, payload: {} });
    await sleep(400);
    checar('tipo de sinal invalido e recusado', /inválido/.test(A.erro.at(-1) || ''), A.erro.at(-1));

    console.log('--- Palco e anfitriao');
    pub(A, `/app/sala/${R}/compartilhar`, 'true');
    await sleep(400);
    checar('anfitriao assume o palco', B.part?.participantes.find((x) => x.nome === 'Anfitriao')?.compartilhando === true);
    B.erro.length = 0;
    pub(B, `/app/sala/${R}/compartilhar`, 'true');
    await sleep(400);
    checar('intruso NAO toma o palco de quem ja compartilha', B.part?.participantes.find((x) => x.nome === 'Anfitriao')?.compartilhando === true && B.part?.participantes.find((x) => x.nome === 'Bruno')?.compartilhando === false, B.erro[0]);

    pub(A, `/app/sala/${R}/compartilhar`, 'false');
    await sleep(300);
    pub(B, `/app/sala/${R}/compartilhar`, 'true');
    await sleep(400);
    checar('Bruno compartilha quando o palco esta livre', B.part?.participantes.find((x) => x.nome === 'Bruno')?.compartilhando === true);

    B.erro.length = 0;
    pub(B, `/app/sala/${R}/parar`, { alvoId: A.meuId });
    pub(B, `/app/sala/${R}/expulsar`, { alvoId: A.meuId });
    await sleep(400);
    checar('nao-anfitriao NAO pode parar nem expulsar', B.erro.length === 2 && /anfitrião/.test(B.erro[0]), B.erro[0]);

    pub(A, `/app/sala/${R}/parar`, { alvoId: B.meuId });
    await sleep(400);
    checar('anfitriao encerra a transmissao de outra pessoa', A.part?.participantes.find((x) => x.nome === 'Bruno')?.compartilhando === false);

    console.log('--- Limites');
    B.chat.length = 0;
    B.erro.length = 0;
    for (let i = 0; i < 20; i++) pub(B, `/app/sala/${R}/chat`, { texto: 'spam ' + i });
    await sleep(800);
    checar('chat em rajada e limitado', A.chat.filter((m) => m.texto.startsWith('spam')).length <= 8 && B.erro.some((e) => /rápido/.test(e)), 'entregues=' + A.chat.filter((m) => m.texto.startsWith('spam')).length);

    const C = await conectar('C');
    await entrar(C, R, 'Carla', { senha: 'segredo1' });
    const extras = [];
    for (let i = 0; i < 7; i++) { const x = await conectar('x' + i); await entrar(x, R, 'Membro' + i, { senha: 'segredo1' }); extras.push(x); }
    const cheia = await conectar('cheia');
    await entrar(cheia, R, 'Excedente', { senha: 'segredo1' });
    checar('sala com 10 participantes recusa o 11o', !cheia.conf && /cheia/.test(cheia.erro[0] || ''), cheia.erro[0]);

    const grande = await conectar('grande');
    pub(grande, `/app/sala/${R}/sinal`, { tipo: 'offer', destinatarioId: 'x', payload: 'a'.repeat(40 * 1024) });
    await sleep(1000);
    checar('mensagem de 40KB derruba a conexao', grande.fechado);

    console.log('--- Expulsao');
    pub(A, `/app/sala/${R}/expulsar`, { alvoId: C.meuId });
    await sleep(900);
    checar('expulso recebe o aviso e tem a conexao fechada', C.expulso && C.fechado);
    checar('lista atualizada sem o expulso', !A.part?.participantes.some((x) => x.nome === 'Carla'));

    console.log('--- Transferencia de anfitriao');
    const antigo = A.meuId;
    await A.c.deactivate();
    await sleep(700);
    checar('ao sair o anfitriao, outro assume', B.part?.donoId && B.part.donoId !== antigo, 'novoDono=' + (B.part?.donoId || '').slice(0, 8));

    console.log(`\nResultado: ${ok} passaram, ${falhas} falharam`);
    process.exit(falhas ? 1 : 0);
})();
