package com.crm.repository;

import com.crm.model.Engineer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EngineerRepository extends JpaRepository<Engineer, Long> {
    boolean existsByUsername(String username);
    Optional<Engineer> findByUsername(String username);
}
