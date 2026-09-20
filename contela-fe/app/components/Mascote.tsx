import { useId } from 'react';

const CASCO = '#f8fafc';
const CASCO_SOMBRA = '#dbe2ea';

export type ChapeuMascote = 'nenhum' | 'festa' | 'coroa' | 'bone';

interface MascoteProps {
    acento: string;
    estagioVisual?: 0 | 1 | 2;
    chapeu?: ChapeuMascote;
    comemorando?: boolean;
    flutuar?: boolean;
    className?: string;
}

const CUPULA = 'M21,35 A29,29 0 0 1 79,35';
const ONDA_1 = 'L79,82 q-7.25,7 -14.5,0 q-7.25,-7 -14.5,0 q-7.25,7 -14.5,0 q-7.25,-7 -14.5,0 ';
const ONDA_2 = 'L79,82 q-7.25,-7 -14.5,0 q-7.25,7 -14.5,0 q-7.25,-7 -14.5,0 q-7.25,7 -14.5,0 ';
const FECHO = 'L21,35 Z';

export function Mascote({
    acento,
    estagioVisual = 1,
    chapeu = 'nenhum',
    comemorando = false,
    flutuar = true,
    className,
}: MascoteProps) {
    const dormindo = estagioVisual === 0;
    const radiante = estagioVisual === 2;
    const gradId = `mascote-${useId().replace(/:/g, '')}`;
    const corpo = `${CUPULA} ${ONDA_1}${FECHO}`;
    const corpoAnimado = `${corpo};${CUPULA} ${ONDA_2}${FECHO};${corpo}`;

    return (
        <svg viewBox="8 0 84 100" className={className} aria-hidden style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CASCO} stopOpacity={1} />
                    <stop offset="55%" stopColor={CASCO} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={CASCO} stopOpacity={0.2} />
                </linearGradient>
            </defs>

            <ellipse cx="50" cy="93" rx="18" ry="3.5" fill={acento} opacity={0.25} />

            <g className={flutuar ? 'mascote-flutuar' : undefined}>
                {radiante && (
                    <g opacity={0.8} className="motion-safe:animate-pulse">
                        <path d="M12 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill={acento} />
                        <path d="M88 24 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" fill={acento} />
                    </g>
                )}

                {radiante && (
                    <>
                        <rect
                            x="4"
                            y="46"
                            width="16"
                            height="7"
                            rx="3.5"
                            fill={CASCO}
                            stroke={CASCO_SOMBRA}
                            strokeWidth="1.5"
                            style={{
                                transformOrigin: '20px 49.5px',
                                transform: comemorando ? 'rotate(-35deg)' : 'rotate(35deg)',
                                transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        />
                        <rect
                            x="80"
                            y="46"
                            width="16"
                            height="7"
                            rx="3.5"
                            fill={CASCO}
                            stroke={CASCO_SOMBRA}
                            strokeWidth="1.5"
                            style={{
                                transformOrigin: '80px 49.5px',
                                transform: comemorando ? 'rotate(35deg)' : 'rotate(-35deg)',
                                transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        />
                    </>
                )}

                <path fill={`url(#${gradId})`} stroke={CASCO_SOMBRA} strokeWidth="1.5" d={corpo}>
                    <animate attributeName="d" dur="3s" repeatCount="indefinite" values={corpoAnimado} />
                </path>

                <ellipse cx="38" cy="26" rx="10" ry="16" fill="#ffffff" opacity={0.5} />

                <ellipse cx="30" cy="48" rx="5" ry="3.5" fill={acento} opacity={0.25} />
                <ellipse cx="70" cy="48" rx="5" ry="3.5" fill={acento} opacity={0.25} />

                {dormindo ? (
                    <>
                        <rect x="29" y="41" width="14" height="3" rx="1.5" fill={acento} opacity={0.7} />
                        <rect x="57" y="41" width="14" height="3" rx="1.5" fill={acento} opacity={0.7} />
                    </>
                ) : (
                    <>
                        {[36, 64].map((cx) => (
                            <g
                                key={cx}
                                style={{
                                    transformOrigin: `${cx}px 41px`,
                                    transform: comemorando ? 'scaleY(0.12)' : 'scaleY(1)',
                                    transition: 'transform 0.25s ease',
                                }}
                            >
                                <ellipse cx={cx} cy="41" rx={radiante ? 9 : 7.5} ry={radiante ? 12 : 10} fill={acento} opacity={0.18} />
                                <ellipse cx={cx} cy="41" rx={radiante ? 6.5 : 5.5} ry={radiante ? 9 : 7.5} fill={acento} />
                                <circle cx={cx - 2} cy="37" r="1.6" fill="#ffffff" opacity={0.9} />
                            </g>
                        ))}
                        <g
                            style={{
                                opacity: comemorando ? 1 : 0,
                                transition: comemorando ? 'opacity 0.2s ease 0.15s' : 'opacity 0.1s ease',
                            }}
                        >
                            <path d="M31,42 Q36,37 41,42" stroke={acento} strokeWidth="2" fill="none" strokeLinecap="round" />
                            <path d="M59,42 Q64,37 69,42" stroke={acento} strokeWidth="2" fill="none" strokeLinecap="round" />
                        </g>
                    </>
                )}

                {chapeu === 'festa' && (
                    <g>
                        <path d="M38 16 L50 2 L62 16 Z" fill={acento} />
                        <circle cx="50" cy="2" r="3" fill="#ffffff" />
                        <circle cx="46" cy="11" r="1.5" fill="#ffffff" opacity={0.8} />
                        <circle cx="54" cy="8" r="1.5" fill="#ffffff" opacity={0.8} />
                    </g>
                )}
                {chapeu === 'coroa' && (
                    <g>
                        <path d="M34 16 L37 4 L44 10 L50 2 L56 10 L63 4 L66 16 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
                        <circle cx="37" cy="4" r="1.8" fill={acento} />
                        <circle cx="50" cy="2" r="1.8" fill={acento} />
                        <circle cx="63" cy="4" r="1.8" fill={acento} />
                    </g>
                )}
                {chapeu === 'bone' && (
                    <g>
                        <path d="M29 15 A21 16 0 0 1 71 15 Z" fill={acento} />
                        <ellipse cx="40" cy="15.5" rx="15" ry="3" fill={acento} opacity={0.85} />
                    </g>
                )}
            </g>
        </svg>
    );
}
