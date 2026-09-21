const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CHAVE_ADMIN = 'chave-de-teste-de-integracao-0123456789abcdef';
const DIR_BACKEND = path.resolve(process.env.DIR_BACKEND || path.join(__dirname, '..', '..', '..', 'be'));
const PORTA_BASE = Number(process.env.PORTA_BASE || 8100);

const SUITES = [
    { nome: 'seguranca', script: 'seguranca.cjs', envBackend: {}, envTeste: {} },
    { nome: 'admin (desligado sem chave)', script: 'admin.cjs', envBackend: {}, envTeste: {} },
    {
        nome: 'admin (com chave)',
        script: 'admin.cjs',
        envBackend: { APP_ADMIN_CHAVE: CHAVE_ADMIN },
        envTeste: { CHAVE: CHAVE_ADMIN },
    },
    { nome: 'versao (aviso desligado)', script: 'versao.cjs', envBackend: {}, envTeste: {} },
    {
        nome: 'versao (servidor na 0.2.0)',
        script: 'versao.cjs',
        envBackend: { APP_VERSAO_ATUAL: '0.2.0' },
        envTeste: { ESPERADO: '0.2.0' },
    },
];

function localizarJar() {
    const alvo = path.join(DIR_BACKEND, 'target');
    const jar = fs.existsSync(alvo) ? fs.readdirSync(alvo).find((f) => /^be-.*\.jar$/.test(f) && !f.endsWith('.original')) : null;
    if (!jar) throw new Error(`Nenhum .jar em ${alvo}. Rode "mvn -DskipTests package" na pasta be antes.`);
    return path.join(alvo, jar);
}

function iniciarBackend(porta, envExtra) {
    const env = { ...process.env, PORT: String(porta), ...envExtra };
    const comando = process.env.COMANDO_BACKEND;
    if (comando) return spawn(comando, { cwd: DIR_BACKEND, env, shell: true, stdio: 'ignore' });
    return spawn('java', ['-jar', localizarJar()], { cwd: DIR_BACKEND, env, stdio: 'ignore' });
}

function encerrar(filho) {
    if (!filho || filho.exitCode !== null) return;
    try {
        if (process.platform === 'win32') execSync(`taskkill /pid ${filho.pid} /T /F`, { stdio: 'ignore' });
        else filho.kill('SIGTERM');
    } catch {}
}

async function aguardarSaude(porta, limiteMs = 120000) {
    const inicio = Date.now();
    while (Date.now() - inicio < limiteMs) {
        try {
            const resposta = await fetch(`http://localhost:${porta}/saude`);
            if (resposta.ok) return;
        } catch {}
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`O backend nao respondeu em /saude na porta ${porta} dentro de ${limiteMs / 1000}s`);
}

function rodarScript(script, porta, envTeste) {
    return new Promise((resolve) => {
        const filho = spawn(process.execPath, [path.join(__dirname, script)], {
            env: { ...process.env, BASE_URL: `http://localhost:${porta}`, ...envTeste },
            stdio: 'inherit',
        });
        filho.on('close', (codigo) => resolve(codigo ?? 1));
    });
}

(async () => {
    const resultados = [];

    for (const [i, suite] of SUITES.entries()) {
        const porta = PORTA_BASE + i;
        console.log(`\n=== ${suite.nome} (porta ${porta}) ===`);
        const backend = iniciarBackend(porta, suite.envBackend);
        let codigo = 1;
        try {
            await aguardarSaude(porta);
            codigo = await rodarScript(suite.script, porta, suite.envTeste);
        } catch (erro) {
            console.error(erro.message);
        } finally {
            encerrar(backend);
        }
        resultados.push({ nome: suite.nome, ok: codigo === 0 });
    }

    console.log('\n=== Resumo ===');
    resultados.forEach((r) => console.log(`${r.ok ? 'OK    ' : 'FALHOU'} ${r.nome}`));
    process.exit(resultados.every((r) => r.ok) ? 0 : 1);
})();
