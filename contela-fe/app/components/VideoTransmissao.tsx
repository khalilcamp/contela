'use client';

import { useEffect, useRef } from 'react';

interface VideoTransmissaoProps {
    stream: MediaStream | null;
    mudo: boolean;
    className?: string;
}

export function VideoTransmissao({ stream, mudo, className }: VideoTransmissaoProps) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = ref.current;
        if (video && video.srcObject !== stream) video.srcObject = stream;
    }, [stream]);

    return <video ref={ref} autoPlay muted={mudo} playsInline className={className} />;
}
