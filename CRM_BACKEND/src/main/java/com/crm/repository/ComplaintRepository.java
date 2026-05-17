package com.crm.repository;

import com.crm.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStatus(String status);

    List<Complaint> findByCustomerId(Long customerId);

    List<Complaint> findByEngineerId(Long engineerId);

    List<Complaint> findByContractId(Long contractId);
}
