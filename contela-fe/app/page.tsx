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
    senha,
    setSenha,
    conectado,
    entrando,
    erro,
    limparErro,
    atualizacao,
    dispensarAtualizacao,
    meuId,
    souDono,
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
    handleCriar,
    handleSair,
    handleEnviarMensagem,
    handleCompartilhar,
    handlePararCompartilhamento,
    handlePararDe,
    handleExpulsar,
  } = useSalaConexao();

  if (!conectado) {
    return (
        <EntrarTela
            nome={nome}
            salaId={salaId}
            senha={senha}
            erro={erro}
            entrando={entrando}
            onNomeChange={setNome}
            onSalaIdChange={setSalaId}
            onSenhaChange={setSenha}
            onEntrar={handleEntrar}
            onCriar={handleCriar}
        />
    );
  }

  return (
      <CompartilhamentoTela
          salaId={salaId}
          senhaSala={senha}
          sala={sala}
          meuId={meuId}
          souDono={souDono}
          aviso={erro}
          onFecharAviso={limparErro}
          atualizacao={atualizacao}
          onDispensarAtualizacao={dispensarAtualizacao}
          compartilhando={compartilhando}
          streamLocal={streamLocal}
          streamsRemotas={streamsRemotas}
          mensagens={mensagens}
          texto={texto}
          onTextoChange={setTexto}
          onEnviarMensagem={handleEnviarMensagem}
          onCompartilhar={handleCompartilhar}
          onPararCompartilhamento={handlePararCompartilhamento}
          onPararDe={handlePararDe}
          onExpulsar={handleExpulsar}
          onSair={handleSair}
          chatAberto={chatAberto}
          onToggleChat={onToggleChat}
      />
  );
}
