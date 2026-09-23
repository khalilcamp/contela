package com.comtela.be.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseMensagem {

    private String id;
    private String integranteId;
    private String nomeIntegrante;
    private String texto;
    private TipoMensagem tipo;
    private Instant enviadaEm;

}
