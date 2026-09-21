const RTPMAP_OPUS = /^a=rtpmap:(\d+) opus\/48000\/2\s*$/im;
const PARAMETROS_ESTEREO = ['stereo', 'sprop-stereo', 'maxaveragebitrate'];

export function sdpTemOpusEstereo(sdp: string | undefined): boolean {
    if (!sdp) return false;
    const rtpmap = RTPMAP_OPUS.exec(sdp);
    if (!rtpmap) return false;
    const fmtp = new RegExp(`^a=fmtp:${rtpmap[1]} (.*)$`, 'im').exec(sdp);
    return fmtp ? /(^|;)\s*stereo=1(;|\s*$)/.test(fmtp[1]) : false;
}

export function pedirOpusEstereo(sdp: string | undefined, kbps = 128): string | undefined {
    if (!sdp) return sdp;
    const rtpmap = RTPMAP_OPUS.exec(sdp);
    if (!rtpmap) return sdp;

    const pt = rtpmap[1];
    const extras = `stereo=1;sprop-stereo=1;maxaveragebitrate=${kbps * 1000}`;
    const linhaFmtp = new RegExp(`^a=fmtp:${pt} (.*?)(\r?)$`, 'im');
    const atual = linhaFmtp.exec(sdp);

    if (!atual) {
        return sdp.replace(RTPMAP_OPUS, (linha) => {
            const quebra = /\r?$/.exec(linha)?.[0] ?? '';
            return `${linha.replace(/\s*$/, '')}\r\na=fmtp:${pt} ${extras}${quebra}`;
        });
    }

    const mantidos = atual[1]
        .split(';')
        .map((p) => p.trim())
        .filter((p) => p && !PARAMETROS_ESTEREO.includes(p.split('=')[0]));
    return sdp.replace(linhaFmtp, `a=fmtp:${pt} ${[...mantidos, extras].join(';')}$2`);
}
