package com.comtela.be.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SinalWebRTC {

    private String tipo;
    private String remetenteId;
    private String destinatarioId;
    private Object payload;

}