package com.comtela.be.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestEntrarSala {

    private String nome;
    private String senha;
    private String tokenDono;
    private String versaoApp;
    private String plataforma;
    private String cor;
    private String chapeu;
}
