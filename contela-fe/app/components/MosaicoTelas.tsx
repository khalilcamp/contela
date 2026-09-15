import { Avatar } from './Avatar';
import { IconChat, IconCursor, IconMic } from './icons';

export function MosaicoTelas() {
    return (
        <div className="relative w-full max-w-md">
            <div className="origin-bottom-left -rotate-2 overflow-hidden rounded-2xl border border-lobby-border bg-discord-bg-secondary shadow-2xl shadow-black/60 transition-transform duration-500 ease-out hover:rotate-0">
                <div className="flex items-center gap-3 border-b border-lobby-border px-4 py-3">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-discord-red/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-discord-green/70" />
                    </div>

                    <span className="flex items-center gap-1.5 text-xs text-discord-text-muted">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-discord-green opacity-75 motion-reduce:animate-none" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-discord-green" />
                        </span>
                        sala-produto
                    </span>

                    <div className="ml-auto flex items-center gap-2.5 text-discord-text-muted">
                        <IconCursor className="h-3.5 w-3.5" />
                        <IconChat className="h-3.5 w-3.5" />
                        <IconMic className="h-3.5 w-3.5" />
                    </div>
                </div>

                <div className="p-4">
                    <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-indigo-500/25 via-violet-500/10 to-discord-bg-tertiary">
                        <div className="absolute inset-4 flex flex-col gap-2 rounded-md bg-white/[0.06] p-3">
                            <div className="h-2 w-2/3 rounded-full bg-white/25" />
                            <div className="h-2 w-full rounded-full bg-white/10" />
                            <div className="h-2 w-4/5 rounded-full bg-white/10" />
                            <div className="mt-2 h-14 w-full rounded-md bg-white/[0.08]" />
                        </div>

                        <div className="absolute left-7 top-8 flex items-center gap-1">
                            <IconCursor className="h-3.5 w-3.5 -rotate-12 text-violet-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                            <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-medium text-white shadow">
                                Ana
                            </span>
                        </div>

                        <div className="absolute bottom-8 right-10 flex items-center gap-1">
                            <IconCursor className="h-3.5 w-3.5 -rotate-12 text-teal-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                            <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-medium text-white shadow">
                                Bruno
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <Avatar id="ana" nome="Ana" tamanho={28} />
                        <Avatar id="bruno" nome="Bruno" tamanho={28} />
                        <Avatar id="lu" nome="Lu" tamanho={28} />
                        <span className="text-xs text-discord-text-muted">+2 na sala</span>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-6 -right-6 w-44 rounded-xl border border-lobby-border bg-discord-bg-secondary/95 p-3 shadow-xl shadow-black/40 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Avatar id="bruno" nome="Bruno" tamanho={20} />
                    <span className="text-xs font-medium text-discord-text">Bruno</span>
                </div>
                <p className="mt-1 text-xs leading-snug text-discord-text-muted">dá uma olhada nisso</p>
            </div>
        </div>
    );
}
