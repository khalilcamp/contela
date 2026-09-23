import { useState } from 'react';
import { Integrante, SalaResponse, MensagemResponse } from '../types/sala';
import { OpcoesCompartilhamento } from '../types/compartilhamento';
import { Aviso } from '../components/Aviso';
import { AvisoAtualizacao } from '../components/AvisoAtualizacao';
import { AvisoVersao } from '../lib/websocket';
import { DiagnosticoPeer } from '../lib/diagnostico';
import { VERSAO_APP, plataformaAtual } from '../lib/versao';
import { DialogoDiagnostico } from '../components/DialogoDiagnostico';
import { DialogoAtalhos } from '../components/DialogoAtalhos';
import { DialogoPrevia } from '../components/DialogoPrevia';
import { useAtalhos } from '../hooks/useAtalhos';
import { useNotificacoesChat } from '../hooks/useNotificacoesChat';
import { useSonsSala } from '../hooks/useSonsSala';
import { DrawerCompartilhamento } from '../components/DrawerCompartilhamento';
import type { PreviaTransmissao } from '../hooks/useSalaConexao';
import { Topbar } from '../components/Topbar';
import { VideoStage } from '../components/VideoStage';
import { ChatPanel } from '../components/ChatPanel';
import { ControlBar } from '../components/ControlBar';

interface CompartilhamentoTelaProps {
    salaId: string;
    senhaSala: string;
    sala: SalaResponse | null;
    meuId: string | null;
    souDono: boolean;
    aviso: string | null;
    onFecharAviso: () => void;
    atualizacao: AvisoVersao | null;
    onDispensarAtualizacao: () => void;
    diagnostico: DiagnosticoPeer[];
    tiposServidoresIce: string[];
    compartilhando: boolean;
    streamLocal: MediaStream | null;
    streamsRemotas: Map<string, MediaStream>;
    mensagens: MensagemResponse[];
    texto: string;
    onTextoChange: (valor: string) => void;
    onEnviarMensagem: () => void;
    onEnviarGif: (url: string) => void;
    previa: PreviaTransmissao | null;
    onCompartilhar: (opcoes: OpcoesCompartilhamento, fonteId: string | null, nomeFonte: string | null) => void;
    onConfirmarTransmissao: () => void;
    onCancelarPrevia: () => void;
    onPararCompartilhamento: () => void;
    onPararDe: (alvoId: string) => void;
    onExpulsar: (alvoId: string) => void;
    onSair: () => void;
    chatAberto: boolean;
    onToggleChat: () => void;
}

export default function CompartilhamentoTela({
    salaId,
    senhaSala,
    sala,
    meuId,
    souDono,
    aviso,
    onFecharAviso,
    atualizacao,
    onDispensarAtualizacao,
    diagnostico,
    tiposServidoresIce,
    compartilhando,
    streamLocal,
    streamsRemotas,
    mensagens,
    texto,
    onTextoChange,
    onEnviarMensagem,
    onEnviarGif,
    previa,
    onCompartilhar,
    onConfirmarTransmissao,
    onCancelarPrevia,
    onPararCompartilhamento,
    onPararDe,
    onExpulsar,
    onSair,
    chatAberto,
    onToggleChat,
}: CompartilhamentoTelaProps) {
    const [drawerAberto, setDrawerAberto] = useState(false);
    const [diagnosticoAberto, setDiagnosticoAberto] = useState(false);
    const [atalhosAbertos, setAtalhosAbertos] = useState(false);
    const [silenciado, setSilenciado] = useState(false);

    const { naoLidas, notificacoes, alternarNotificacoes } = useNotificacoesChat({
        mensagens,
        meuId,
        chatAberto,
        onAbrirChat: () => {
            if (!chatAberto) onToggleChat();
        },
    });

    const { sonsAtivos, alternarSons } = useSonsSala({ participantes: sala?.participantes ?? [], meuId });

    const { globais, alterarGlobais, falhas } = useAtalhos((acao) => {
        if (acao === 'silenciar') setSilenciado((atual) => !atual);
        else if (acao === 'chat') onToggleChat();
        else if (acao === 'chat-abrir') {
            if (!chatAberto) onToggleChat();
        } else if (acao === 'parar') {
            if (compartilhando) onPararCompartilhamento();
        } else if (acao === 'ajuda') setAtalhosAbertos((atual) => !atual);
    });
    const participantes = sala?.participantes ?? [];
    const outroCompartilhando = participantes.some((p) => p.compartilhando && p.id !== meuId);
    const participantesPorId = new Map(participantes.map((p) => [p.id, p]));

    const acoesPara = souDono
        ? (p: Integrante) =>
              p.id === meuId
                  ? []
                  : [
                        ...(p.compartilhando ? [{ rotulo: 'Encerrar', onClick: () => onPararDe(p.id) }] : []),
                        { rotulo: 'Remover', perigo: true, onClick: () => onExpulsar(p.id) },
                    ]
        : undefined;

    return (
        <div className="flex h-screen flex-col bg-ink text-paper">
            <Topbar
                salaId={salaId}
                senhaSala={senhaSala}
                participantes={participantes}
                meuId={meuId}
                donoId={sala?.donoId ?? null}
                souDono={souDono}
                acoesPara={acoesPara}
                chatAberto={chatAberto}
                naoLidas={naoLidas}
                onToggleChat={onToggleChat}
                onAbrirAtalhos={() => setAtalhosAbertos(true)}
                sonsAtivos={sonsAtivos}
                onAlternarSons={alternarSons}
                onSair={onSair}
            />

            <AvisoAtualizacao aviso={atualizacao} onDispensar={onDispensarAtualizacao} />

            <Aviso mensagem={aviso} onFechar={onFecharAviso} />

            <div className="flex flex-1 overflow-hidden">
                <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                    <VideoStage
                        streamLocal={streamLocal}
                        meuId={meuId}
                        participantes={participantes}
                        streamsRemotas={streamsRemotas}
                        acoesPara={acoesPara}
                        diagnostico={diagnostico}
                        onAbrirDiagnostico={() => setDiagnosticoAberto(true)}
                        silenciado={silenciado}
                        onSilenciadoChange={setSilenciado}
                    />

                    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                        <div className="pointer-events-auto">
                            <ControlBar
                                compartilhando={compartilhando}
                                bloqueado={outroCompartilhando}
                                onCompartilhar={() => setDrawerAberto(true)}
                                onPararCompartilhamento={onPararCompartilhamento}
                            />
                        </div>
                    </div>
                </div>

                {chatAberto && (
                    <ChatPanel
                        mensagens={mensagens}
                        texto={texto}
                        onTextoChange={onTextoChange}
                        onEnviar={onEnviarMensagem}
                        onEnviarGif={onEnviarGif}
                        meuId={meuId}
                        notificacoes={notificacoes}
                        onAlternarNotificacoes={alternarNotificacoes}
                        participantesPorId={participantesPorId}
                    />
                )}
            </div>

            <DialogoDiagnostico
                aberto={diagnosticoAberto}
                onFechar={() => setDiagnosticoAberto(false)}
                diagnostico={diagnostico}
                nomes={new Map(participantes.map((p) => [p.id, p.nome]))}
                contexto={{
                    versao: VERSAO_APP,
                    plataforma: plataformaAtual(),
                    servidoresIce: tiposServidoresIce,
                    participantes: participantes.length,
                    navegador: navigator.userAgent,
                }}
            />

            <DrawerCompartilhamento
                aberto={drawerAberto}
                onFechar={() => setDrawerAberto(false)}
                onIniciar={(opcoes, fonteId, nomeFonte) => {
                    setDrawerAberto(false);
                    onCompartilhar(opcoes, fonteId, nomeFonte);
                }}
            />

            <DialogoAtalhos
                aberto={atalhosAbertos}
                onFechar={() => setAtalhosAbertos(false)}
                globais={globais}
                onAlterarGlobais={alterarGlobais}
                falhas={falhas}
            />

            {previa && (
                <DialogoPrevia
                    previa={previa}
                    onIrAoVivo={onConfirmarTransmissao}
                    onVoltar={() => {
                        onCancelarPrevia();
                        setDrawerAberto(true);
                    }}
                    onCancelar={onCancelarPrevia}
                />
            )}
        </div>
    );
}
