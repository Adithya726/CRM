package com.crm.repository;

import com.crm.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    // All contracts for a specific customer
    List<Contract> findByCustomerId(Long customerId);

    @Query("""
            select c from Contract c
            where c.customer.id = :customerId
              and c.periodFrom is not null
              and c.periodTo is not null
              and :today between c.periodFrom and c.periodTo
            """)
    List<Contract> findActiveByCustomerId(@Param("customerId") Long customerId, @Param("today") LocalDate today);
}