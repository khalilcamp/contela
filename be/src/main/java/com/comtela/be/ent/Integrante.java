package com.comtela.be.ent;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Integrante {

    private String id;
    private String salaId;
    private String nome;
    private boolean compartilhandoTela;
    private Instant entrouEm;
    private String cor;
    private String chapeu;
}
