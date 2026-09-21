const { Client } = require('@stomp/stompjs');
const SockJS = require('sockjs-client');
const BASE = process.env.BASE_URL || 'http://localhost:8090';
const ESPERADO = process.env.ESPERADO;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, falhas = 0;
const checar = (nome, cond, detalhe = '') => { cond ? ok++ : falhas++; console.log((cond ? 'PASSOU ' : 'FALHOU ') + nome + (detalhe ? '  -> ' + detalhe : '')); };

async function entrarComo(perfil, sala, nome) {
    const r = { erros: [], avisos: [], tConf: null, tErro: null, tAviso: null, expulsoPeloAviso: false };
    const c = new Client({ webSocketFactory: () => new SockJS(BASE + '/wsock'), reconnectDelay: 0 });
    await new Promise((res) => {
        c.onConnect = res;
        c.activate();
    });
    c.subscribe('/user/queue/erro', (m) => { r.erros.push(m.body); r.tErro ??= Date.now(); });
    c.subscribe('/user/queue/aviso', (m) => { r.avisos.push(JSON.parse(m.body)); r.tAviso ??= Date.now(); });
    c.subscribe('/user/queue/confirmacao', () => {
        r.tConf = Date.now();
        c.subscribe(`/topic/sala/${sala}/participantes`, () => {});
        c.publish({ destination: `/app/sala/${sala}/sincronizar`, body: '' });
    });
    await sleep(150);
    c.publish({ destination: `/app/sala/${sala}/entrar`, body: JSON.stringify({ nome, ...perfil }) });
    await sleep(1200);
    r.conectado = c.connected;
    await c.deactivate();
    return r;
}

(async () => {
    const sala = (await (await fetch(BASE + '/api/salas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json()).id;
    const ancora = new Client({ webSocketFactory: () => new SockJS(BASE + '/wsock'), reconnectDelay: 0 });
    await new Promise((res) => { ancora.onConnect = res; ancora.activate(); });
    ancora.subscribe('/user/queue/confirmacao', () => {});
    await sleep(150);
    ancora.publish({ destination: '/app/sala/' + sala + '/entrar', body: JSON.stringify({ nome: 'Ancora', versaoApp: '9.9.9', plataforma: 'web' }) });
    await sleep(500);
    const criar = async () => sala;

    const legado = await entrarComo({}, await criar(), 'Legado');
    const antigo = await entrarComo({ versaoApp: '0.1.3', plataforma: 'desktop' }, await criar(), 'Antigo');
    const atual = await entrarComo({ versaoApp: '0.2.0', plataforma: 'desktop' }, await criar(), 'Atual');
    const futuro = await entrarComo({ versaoApp: '0.3.0', plataforma: 'desktop' }, await criar(), 'Futuro');
    const web = await entrarComo({ versaoApp: '0.1.0', plataforma: 'web' }, await criar(), 'Web');
    const invalida = await entrarComo({ versaoApp: 'abc', plataforma: 'desktop' }, await criar(), 'Invalida');

    if (!ESPERADO) {
        checar('sem versao configurada no servidor, ninguem recebe aviso', [legado, antigo, atual, web].every((x) => !x.erros.length && !x.avisos.length));
        console.log(`\nResultado: ${ok} passaram, ${falhas} falharam`);
        process.exit(falhas ? 1 : 0);
    }

    checar('versao ANTIGA sem suporte (nao envia versao) recebe o aviso pelo canal que ela ja exibe', legado.erros.length === 1 && legado.erros[0].includes(ESPERADO) && legado.erros[0].includes('github.com/khalilcamp/contela/releases/latest'), legado.erros[0]);
    checar('o aviso chega DEPOIS da confirmacao de entrada (nao aborta a entrada)', legado.tErro > legado.tConf && legado.conectado, `conf->erro = ${legado.tErro - legado.tConf} ms, ainda conectado: ${legado.conectado}`);
    checar('versao 0.1.3 recebe o aviso estruturado (com botao)', antigo.avisos.length === 1 && antigo.avisos[0].versao === ESPERADO && antigo.erros.length === 0, JSON.stringify(antigo.avisos[0]));
    checar('versao igual a atual nao recebe nada', !atual.erros.length && !atual.avisos.length);
    checar('versao mais nova que a configurada nao recebe nada', !futuro.erros.length && !futuro.avisos.length);
    checar('plataforma web nao recebe aviso de "baixar"', !web.erros.length && !web.avisos.length);
    checar('versao malformada e tratada como antiga (mensagem de texto)', invalida.erros.length === 1 && !invalida.avisos.length, invalida.erros[0]);
    console.log(`\nResultado: ${ok} passaram, ${falhas} falharam`);
    await ancora.deactivate();
    process.exit(falhas ? 1 : 0);
})();
