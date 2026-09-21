interface IconProps {
    className?: string;
    style?: React.CSSProperties;
}

export function IconMonitor({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
        </svg>
    );
}

export function IconMonitorOff({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4M3 3l18 18" />
        </svg>
    );
}

export function IconCursor({ className, style }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
            <path d="M4 2.5 20 9.8l-6.9 1.6L10 18.9z" />
        </svg>
    );
}

export function IconUsuario({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
        </svg>
    );
}

export function IconChat({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 5h16v11H8l-4 4z" />
        </svg>
    );
}

export function IconMic({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
    );
}

export function IconSend({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 12 20 4l-6 16-3-7-7-3z" />
        </svg>
    );
}

export function IconSala({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" />
        </svg>
    );
}

export function IconFechar({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}

export function IconCopiar({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
        </svg>
    );
}

export function IconSair({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
            <path d="M10 8l-4 4 4 4M6 12h10" />
        </svg>
    );
}

export function IconVolume({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 10v4h3.5L12 18V6L7.5 10z" />
            <path d="M15.5 9.5a4 4 0 0 1 0 5M18 7a7.5 7.5 0 0 1 0 10" />
        </svg>
    );
}

export function IconMudo({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 10v4h3.5L12 18V6L7.5 10z" />
            <path d="M16 9.5l5 5M21 9.5l-5 5" />
        </svg>
    );
}

export function IconTelaCheia({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
        </svg>
    );
}

export function IconEscudo({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
            <path d="M9.5 12l2 2 3.5-4" />
        </svg>
    );
}

export function IconJanela({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 9h18" />
        </svg>
    );
}

export function IconTeclado({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2.5" y="6" width="19" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
        </svg>
    );
}

export function IconSino({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" />
            <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
    );
}

export function IconSinoOff({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" />
            <path d="M10 19a2 2 0 0 0 4 0M3 3l18 18" />
        </svg>
    );
}

export function IconLink({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
            <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
        </svg>
    );
}
