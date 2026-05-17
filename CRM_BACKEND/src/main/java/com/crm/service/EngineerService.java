package com.crm.service;

import com.crm.model.EngineerDTO;

import java.util.List;

public interface EngineerService {
    EngineerDTO create(EngineerDTO dto);
    EngineerDTO update(Long id, EngineerDTO dto);
    void delete(Long id);
    EngineerDTO getById(Long id);
    List<EngineerDTO> getAll();
}
