'use client';

import { useState } from 'react';
import { corAvatar } from '../lib/avatar';
import { Avatar } from './Avatar';
import { Enquadramento } from './Enquadramento';
import { IconChat, IconCursor } from './icons';
import { Mascote } from './Mascote';

export function MosaicoTelas() {
    const [animado, setAnimado] = useState(false);

    return (
        <div
            className="relative w-full max-w-md pt-20"
            onMouseEnter={() => setAnimado(true)}
            onMouseLeave={() => setAnimado(false)}
        >
            <Mascote
                acento="#2dd4bf"
                estagioVisual={2}
                comemorando={animado}
                className="pointer-events-none absolute right-10 top-0 z-10 h-[104px] w-[104px]"
            />

            <div className="origin-bottom-left -rotate-2 overflow-hidden rounded-xl border border-line bg-ink-2 shadow-2xl shadow-black/60 transition-transform duration-500 ease-out hover:rotate-0 motion-reduce:transition-none">
                <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                    <span className="flex items-center gap-1.5 rounded-md bg-live/15 px-2 py-0.5 text-xs font-medium text-live">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75 motion-reduce:animate-none" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
                        </span>
                        No ar
                    </span>
                    <span className="text-xs text-mute">sala-produto</span>
                    <IconChat className="ml-auto h-3.5 w-3.5 text-mute" />
                </div>

                <div className="p-5">
                    <Enquadramento className="aspect-video bg-ink">
                        <div className="absolute inset-3 flex flex-col gap-2 rounded-md bg-white/[0.05] p-3">
                            <div className="h-2 w-2/3 rounded-full bg-white/25" />
                            <div className="h-2 w-full rounded-full bg-white/10" />
                            <div className="h-2 w-4/5 rounded-full bg-white/10" />
                            <div className="mt-2 h-14 w-full rounded-md bg-signal/10" />
                        </div>

                        <div className="absolute left-7 top-8 flex items-center gap-1">
                            <IconCursor className="h-3.5 w-3.5 -rotate-12" style={{ color: corAvatar('ana') }} />
                            <span
                                className="rounded-md px-2 py-0.5 text-[10px] font-medium text-ink"
                                style={{ backgroundColor: corAvatar('ana') }}
                            >
                                Ana
                            </span>
                        </div>

                        <div className="absolute bottom-6 right-8 flex items-center gap-1">
                            <IconCursor className="h-3.5 w-3.5 -rotate-12" style={{ color: corAvatar('bruno') }} />
                            <span
                                className="rounded-md px-2 py-0.5 text-[10px] font-medium text-ink"
                                style={{ backgroundColor: corAvatar('bruno') }}
                            >
                                Bruno
                            </span>
                        </div>
                    </Enquadramento>

                    <div className="mt-5 flex items-center gap-1">
                        <Avatar id="ana" nome="Ana" tamanho={34} />
                        <Avatar id="bruno" nome="Bruno" tamanho={34} />
                        <Avatar id="lu" nome="Lu" tamanho={34} />
                        <span className="ml-1 text-xs text-mute">+2 na sala</span>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-6 -right-6 w-44 rounded-lg border border-line bg-ink-2/95 p-3 shadow-xl shadow-black/40 backdrop-blur">
                <div className="flex items-center gap-1">
                    <Avatar id="bruno" nome="Bruno" tamanho={24} />
                    <span className="text-xs font-medium text-paper">Bruno</span>
                </div>
                <p className="mt-1 text-xs leading-snug text-mute">dá uma olhada nisso</p>
            </div>
        </div>
    );
}
