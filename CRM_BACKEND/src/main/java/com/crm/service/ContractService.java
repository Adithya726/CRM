package com.crm.service;

import com.crm.model.ContractDTO;

import java.util.List;

public interface ContractService {

    ContractDTO addContract(ContractDTO dto);

    ContractDTO updateContract(Long id, ContractDTO dto);

    void deleteContract(Long id, String closeRemark);

    ContractDTO getContractById(Long id);

    List<ContractDTO> getAllContracts();

    List<ContractDTO> getContractsByCustomer(Long customerId);

    List<ContractDTO> getActiveContractsByCustomer(Long customerId);
}