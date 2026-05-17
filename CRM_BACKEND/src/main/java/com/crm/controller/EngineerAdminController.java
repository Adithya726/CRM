package com.crm.controller;

import com.crm.model.EngineerDTO;
import com.crm.service.EngineerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/engineers")
@CrossOrigin("*")
public class EngineerAdminController {

    @Autowired
    private EngineerService engineerService;

    @PostMapping
    public ResponseEntity<EngineerDTO> create(@RequestBody EngineerDTO dto) {
        return ResponseEntity.ok(engineerService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<EngineerDTO>> list() {
        return ResponseEntity.ok(engineerService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EngineerDTO> get(@PathVariable Long id) {
        return ResponseEntity.ok(engineerService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EngineerDTO> update(@PathVariable Long id, @RequestBody EngineerDTO dto) {
        return ResponseEntity.ok(engineerService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        engineerService.delete(id);
        return ResponseEntity.ok("Engineer deleted successfully.");
    }
}
