package com.comtela.be.ent;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Mensagem {

    private String id;
    private String salaId;
    private String integranteId;
    private String nomeMembro;
    private String texto;
    private Instant enviadaEm;
}
