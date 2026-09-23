package com.comtela.be.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseIntegrante {

    private String id;
    private String nome;
    private boolean compartilhando;
    private String cor;
    private String chapeu;
}
