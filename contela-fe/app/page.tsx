'use client';

import { useSalaConexao } from './hooks/useSalaConexao';
import EntrarTela from './pages/entrarTela';
import CompartilhamentoTela from './pages/compartilhamentoTela';

export default function Home() {
  const {
    nome,
    setNome,
    salaId,
    setSalaId,
    conectado,
    meuId,
    sala,
    mensagens,
    texto,
    setTexto,
    compartilhando,
    streamLocal,
    streamsRemotas,
    chatAberto,
    onToggleChat,
    handleEntrar,
    handleEnviarMensagem,
    handleCompartilhar,
    handlePararCompartilhamento,
  } = useSalaConexao();

  if (!conectado) {
    return (
        <EntrarTela
            nome={nome}
            salaId={salaId}
            onNomeChange={setNome}
            onSalaIdChange={setSalaId}
            onEntrar={handleEntrar}
        />
    );
  }

  return (
      <CompartilhamentoTela
          salaId={salaId}
          sala={sala}
          meuId={meuId}
          compartilhando={compartilhando}
          streamLocal={streamLocal}
          streamsRemotas={streamsRemotas}
          mensagens={mensagens}
          texto={texto}
          onTextoChange={setTexto}
          onEnviarMensagem={handleEnviarMensagem}
          onCompartilhar={handleCompartilhar}
          onPararCompartilhamento={handlePararCompartilhamento}
          chatAberto={chatAberto}
          onToggleChat={onToggleChat}
      />
  );
}
