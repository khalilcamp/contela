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
    cor,
    setCor,
    chapeu,
    setChapeu,
    conectado,
    entrando,
    servidor,
    servidorAcordou,
    erro,
    limparErro,
    atualizacao,
    dispensarAtualizacao,
    diagnostico,
    tiposServidoresIce,
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
    handleEnviarGif,
    handleDigitar,
    digitando,
    previa,
    handleCompartilhar,
    handleConfirmarTransmissao,
    handleCancelarPrevia,
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
            cor={cor}
            chapeu={chapeu}
            erro={erro}
            entrando={entrando}
            servidor={servidor}
            servidorAcordou={servidorAcordou}
            onNomeChange={setNome}
            onSalaIdChange={setSalaId}
            onSenhaChange={setSenha}
            onCorChange={setCor}
            onChapeuChange={setChapeu}
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
          diagnostico={diagnostico}
          tiposServidoresIce={tiposServidoresIce}
          compartilhando={compartilhando}
          streamLocal={streamLocal}
          streamsRemotas={streamsRemotas}
          meuNome={nome}
          mensagens={mensagens}
          texto={texto}
          onTextoChange={setTexto}
          onEnviarMensagem={handleEnviarMensagem}
          onEnviarGif={handleEnviarGif}
          onDigitar={handleDigitar}
          digitando={digitando}
          previa={previa}
          onCompartilhar={handleCompartilhar}
          onConfirmarTransmissao={handleConfirmarTransmissao}
          onCancelarPrevia={handleCancelarPrevia}
          onPararCompartilhamento={handlePararCompartilhamento}
          onPararDe={handlePararDe}
          onExpulsar={handleExpulsar}
          onSair={handleSair}
          chatAberto={chatAberto}
          onToggleChat={onToggleChat}
      />
  );
}
