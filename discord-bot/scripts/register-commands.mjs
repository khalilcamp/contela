const appId = process.env.DISCORD_APP_ID?.trim();
const token = process.env.DISCORD_BOT_TOKEN?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();

if (!appId || !token) {
    console.error('Defina DISCORD_APP_ID e DISCORD_BOT_TOKEN (no .env ou no ambiente).');
    process.exit(1);
}

const opcoesSenha = [
    {
        type: 3,
        name: 'senha',
        description: 'Protege a sala com senha (opcional)',
        required: false,
        min_length: 4,
        max_length: 64,
    },
];

const comandos = [
    {
        name: 'contela',
        description: 'Cria uma sala do Contela e manda o link',
        options: opcoesSenha,
    },
    {
        name: 'startscreenshare',
        description: 'Cria uma sala do Contela e manda o link',
        options: opcoesSenha,
    },
];

const base = `https://discord.com/api/v10/applications/${appId}`;
const url = guildId ? `${base}/guilds/${guildId}/commands` : `${base}/commands`;

const resposta = await fetch(url, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${token}`,
    },
    body: JSON.stringify(comandos),
});

if (!resposta.ok) {
    console.error(resposta.status, await resposta.text());
    process.exit(1);
}

console.log(`Comandos registrados em ${guildId ? `guild ${guildId}` : 'escopo global'}.`);
