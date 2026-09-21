package com.comtela.be.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class SaudeController {

    @GetMapping("/saude")
    public ResponseEntity<Map<String, String>> saude() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of("status", "ok"));
    }
}
