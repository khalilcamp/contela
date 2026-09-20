interface EnquadramentoProps {
    children: React.ReactNode;
    className?: string;
    cor?: string;
}

export function Enquadramento({ children, className = '', cor }: EnquadramentoProps) {
    const canto = 'pointer-events-none absolute h-4 w-4';
    const estilo = cor ? { borderColor: cor } : undefined;
    const base = cor ? '' : 'border-signal';

    return (
        <div className={`relative rounded-sm ${className}`}>
            <div className="absolute inset-0 overflow-hidden rounded-sm">{children}</div>
            <span aria-hidden style={estilo} className={`${canto} ${base} -left-1.5 -top-1.5 border-l-2 border-t-2`} />
            <span aria-hidden style={estilo} className={`${canto} ${base} -right-1.5 -top-1.5 border-r-2 border-t-2`} />
            <span aria-hidden style={estilo} className={`${canto} ${base} -bottom-1.5 -left-1.5 border-b-2 border-l-2`} />
            <span aria-hidden style={estilo} className={`${canto} ${base} -bottom-1.5 -right-1.5 border-b-2 border-r-2`} />
        </div>
    );
}
