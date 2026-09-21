const { Client } = require('@stomp/stompjs');
const SockJS = require('sockjs-client');
const BASE = process.env.BASE_URL || 'http://localhost:8090';
const CHAVE = process.env.CHAVE;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, falhas = 0;
const checar = (nome, cond, detalhe = '') => { cond ? ok++ : falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (detalhe ? '  -> ' + detalhe : '')); };

async function criarSala() {
    const r = await fetch(BASE + '/api/salas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    return r.json();
}
function conectar() {
    return new Promise((res) => {
        const s = { erro: [], conf: null, expulso: null, fechado: false, chat: [] };
        const c = new Client({ webSocketFactory: () => new SockJS(BASE + '/wsock'), reconnectDelay: 0 });
        c.onWebSocketClose = () => (s.fechado = true);
        c.onConnect = () => {
            c.subscribe('/user/queue/confirmacao', (m) => (s.conf = JSON.parse(m.body)));
            c.subscribe('/user/queue/erro', (m) => s.erro.push(m.body));
            c.subscribe('/user/queue/expulso', (m) => (s.expulso = m.body));
            s.c = c;
            res(s);
        };
        c.activate();
    });
}
async function entrar(s, sala, nome) {
    s.erro.length = 0; s.conf = null;
    s.c.publish({ destination: `/app/sala/${sala}/entrar`, body: JSON.stringify({ nome }) });
    for (let i = 0; i < 20 && !s.conf && !s.erro.length; i++) await sleep(60);
    if (s.conf) {
        s.c.subscribe(`/topic/sala/${sala}/chat`, (m) => s.chat.push(JSON.parse(m.body)));
        await sleep(200);
    }
}
const encerrar = (sala, chave) => fetch(`${BASE}/api/admin/salas/${sala}/encerrar`, { method: 'POST', headers: chave ? { 'X-Admin-Chave': chave } : {} });

(async () => {
    if (!CHAVE) {
        const r = await encerrar('AAAA-AAAA', 'qualquer-chave-com-mais-de-16-caracteres');
        checar('sem chave configurada, o endpoint fica desligado (404)', r.status === 404, 'status ' + r.status);
        process.exit(falhas ? 1 : 0);
    }

    const A = await criarSala();
    const B = await criarSala();
    const a1 = await conectar(), a2 = await conectar(), b1 = await conectar();
    await entrar(a1, A.id, 'Ana'); await entrar(a2, A.id, 'Bia'); await entrar(b1, B.id, 'Caio');
    checar('3 participantes em 2 salas', !!a1.conf && !!a2.conf && !!b1.conf);

    let r = await encerrar(A.id, undefined);
    checar('sem cabecalho de chave: 403', r.status === 403, 'status ' + r.status);
    r = await encerrar(A.id, 'chave-errada-mas-comprida-o-bastante');
    checar('chave errada: 403', r.status === 403, 'status ' + r.status);
    await sleep(300);
    checar('nada foi derrubado pelas tentativas invalidas', !a1.fechado && !a2.fechado && a1.expulso === null);

    r = await encerrar('ZZZZ-ZZZZ', CHAVE);
    checar('chave certa em sala inexistente: 404', r.status === 404, 'status ' + r.status);

    r = await encerrar(A.id.toLowerCase(), CHAVE);
    const corpo = await r.json().catch(() => ({}));
    checar('chave certa encerra a sala denunciada (aceita minusculas)', r.status === 200 && corpo.encerrada === true && corpo.participantes === 2, JSON.stringify(corpo));

    await sleep(900);
    checar('os 2 participantes da sala denunciada recebem o aviso "encerrada"', a1.expulso === 'encerrada' && a2.expulso === 'encerrada');
    checar('e tiveram a conexao fechada', a1.fechado && a2.fechado);

    checar('a OUTRA sala continua conectada', !b1.fechado && b1.expulso === null);
    const b2 = await conectar();
    await entrar(b2, B.id, 'Duda');
    b1.c.publish({ destination: `/app/sala/${B.id}/chat`, body: JSON.stringify({ texto: 'ainda funciona' }) });
    await sleep(500);
    checar('a outra sala ainda troca mensagens e aceita gente nova', !!b2.conf && b2.chat.some((m) => m.texto === 'ainda funciona'));

    const c1 = await conectar();
    await entrar(c1, A.id, 'Eva');
    checar('o codigo encerrado deixa de funcionar', !c1.conf && /não encontrada/i.test(c1.erro[0] || ''), c1.erro[0]);

    let limitado = 0;
    for (let i = 0; i < 14; i++) { const x = await encerrar(A.id, 'tentativa-invalida-' + i + '-xxxxxxxxxx'); if (x.status === 429) limitado++; }
    checar('tentativas de chave em excesso sao limitadas (429)', limitado > 0, limitado + ' bloqueadas');

    console.log(`\nResultado: ${ok} passaram, ${falhas} falharam`);
    process.exit(falhas ? 1 : 0);
})();
