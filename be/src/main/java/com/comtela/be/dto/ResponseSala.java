package com.comtela.be.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseSala {

    private String salaId;
    private List<ResponseIntegrante> participantes;
}
