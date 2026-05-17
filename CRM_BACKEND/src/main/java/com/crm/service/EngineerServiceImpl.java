package com.crm.service;

import com.crm.model.Engineer;
import com.crm.model.EngineerDTO;
import com.crm.repository.EngineerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EngineerServiceImpl implements EngineerService {

    @Autowired
    private EngineerRepository engineerRepository;

    private EngineerDTO toDTO(Engineer e) {
        return new EngineerDTO(e.getId(), e.getUsername(), e.getPhone());
    }

    private void apply(Engineer e, EngineerDTO dto) {
        e.setUsername(dto.getUsername());
        e.setPhone(dto.getPhone());
    }

    @Override
    @Transactional
    public EngineerDTO create(EngineerDTO dto) {
        if (dto.getUsername() == null || dto.getUsername().isBlank()) {
            throw new RuntimeException("Engineer username is required");
        }
        if (dto.getPhone() == null || dto.getPhone().isBlank()) {
            throw new RuntimeException("Engineer phone is required");
        }
        if (engineerRepository.existsByUsername(dto.getUsername().trim())) {
            throw new RuntimeException("Engineer username already exists");
        }
        Engineer e = new Engineer();
        apply(e, new EngineerDTO(null, dto.getUsername().trim(), dto.getPhone().trim()));
        return toDTO(engineerRepository.save(e));
    }

    @Override
    @Transactional
    public EngineerDTO update(Long id, EngineerDTO dto) {
        Engineer e = engineerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Engineer not found: " + id));
        if (dto.getUsername() == null || dto.getUsername().isBlank()) {
            throw new RuntimeException("Engineer username is required");
        }
        if (dto.getPhone() == null || dto.getPhone().isBlank()) {
            throw new RuntimeException("Engineer phone is required");
        }
        String newUser = dto.getUsername().trim();
        if (!newUser.equals(e.getUsername()) && engineerRepository.existsByUsername(newUser)) {
            throw new RuntimeException("Engineer username already exists");
        }
        apply(e, new EngineerDTO(id, newUser, dto.getPhone().trim()));
        return toDTO(engineerRepository.save(e));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!engineerRepository.existsById(id)) {
            throw new RuntimeException("Engineer not found: " + id);
        }
        engineerRepository.deleteById(id);
    }

    @Override
    public EngineerDTO getById(Long id) {
        return toDTO(engineerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Engineer not found: " + id)));
    }

    @Override
    public List<EngineerDTO> getAll() {
        return engineerRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }
}
