const RTPMAP_VIDEO = /^a=rtpmap:(\d+) (h264|vp8|vp9|av1)\/\d+\s*$/gim;

function payloadTypesDeVideo(sdp: string): string[] {
    const regex = new RegExp(RTPMAP_VIDEO.source, 'gim');
    const pts: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(sdp)) !== null) {
        pts.push(m[1]);
    }
    return pts;
}

/**
 * Forca um bitrate inicial alto via parametros nao-padrao do Chrome (x-google-*),
 * pra nao depender da rampa de subida conservadora do estimador de banda do WebRTC
 * (relevante sobretudo em rede local, onde a banda real disponivel e bem maior
 * do que a estimativa inicial).
 */
export function forcarBitrateInicial(sdp: string | undefined, maxBitrateBps: number): string | undefined {
    if (!sdp) return sdp;
    const maxKbps = Math.round(maxBitrateBps / 1000);
    const startKbps = Math.round(maxKbps * 0.7);
    const minKbps = Math.min(500, Math.round(maxKbps * 0.3));
    const extras = `x-google-start-bitrate=${startKbps};x-google-min-bitrate=${minKbps};x-google-max-bitrate=${maxKbps}`;

    let resultado = sdp;
    for (const pt of payloadTypesDeVideo(sdp)) {
        const linhaFmtp = new RegExp(`^a=fmtp:${pt} (.*?)(\r?)$`, 'im');
        const atual = linhaFmtp.exec(resultado);

        if (!atual) {
            const linhaRtpmap = new RegExp(`^a=rtpmap:${pt} .*$`, 'im');
            resultado = resultado.replace(linhaRtpmap, (linha) => {
                const quebra = /\r?$/.exec(linha)?.[0] ?? '';
                return `${linha.replace(/\s*$/, '')}\r\na=fmtp:${pt} ${extras}${quebra}`;
            });
            continue;
        }

        const mantidos = atual[1]
            .split(';')
            .map((p) => p.trim())
            .filter((p) => p && !p.startsWith('x-google-'));
        resultado = resultado.replace(linhaFmtp, `a=fmtp:${pt} ${[...mantidos, extras].join(';')}$2`);
    }
    return resultado;
}
