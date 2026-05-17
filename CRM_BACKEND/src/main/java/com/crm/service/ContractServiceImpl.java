package com.crm.service;

import com.crm.model.Contract;
import com.crm.model.ContractDTO;
import com.crm.model.Complaint;
import com.crm.model.Customer;
import com.crm.model.CustomerDTO;
import com.crm.repository.ComplaintRepository;
import com.crm.repository.ContractRepository;
import com.crm.repository.CustomerRepository;
import com.crm.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContractServiceImpl implements ContractService {

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    // ── Helpers ─────────────────────────────────────────────────────────────

    /** DTO → Entity (also runs auto-calculations) */
    private Contract toEntity(ContractDTO dto, Contract contract) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found: " + dto.getCustomerId()));

        contract.setCustomer(customer);
        contract.setCustomerIdSnapshot(customer.getId());
        contract.setCustomerNameSnapshot(customer.getName());
        contract.setContractType(dto.getContractType());
        contract.setPeriodFrom(dto.getPeriodFrom());
        contract.setPeriodTo(dto.getPeriodTo());
        contract.setSla(dto.getSla());
        contract.setPmFrequency(dto.getPmFrequency());
        contract.setPcbText(dto.getPcbText());
        contract.setProductTypes(dto.getProductTypes());
        contract.setPaymentTerms(dto.getPaymentTerms());
        contract.setPaymentSide(dto.getPaymentSide());
        contract.setPoNumber(dto.getPoNumber());
        contract.setPoValue(dto.getPoValue());
        contract.setPoBasicValue(dto.getPoBasicValue());
        contract.setTaxPercent(dto.getTaxPercent());

        // Auto-calculate tax value
        double basic = dto.getPoBasicValue() != null ? dto.getPoBasicValue() : 0.0;
        double taxPct = dto.getTaxPercent() != null ? dto.getTaxPercent() : 0.0;
        double taxVal = Math.round(basic * taxPct / 100.0 * 100.0) / 100.0;
        double totalPO = Math.round((basic + taxVal) * 100.0) / 100.0;

        double sparesPct = dto.getSparesProvisionPercent() != null ? dto.getSparesProvisionPercent() : 0.0;
        double sparesVal = Math.round(basic * sparesPct / 100.0 * 100.0) / 100.0;

        contract.setTaxValue(taxVal);
        contract.setTotalPoValue(totalPO);
        contract.setSparesProvisionPercent(sparesPct);
        contract.setSparesProvisionValue(sparesVal);

        return contract;
    }

    /** Entity → DTO */
    private ContractDTO toDTO(Contract c) {
        ContractDTO dto = new ContractDTO();
        dto.setId(c.getId());
        if (c.getCustomer() != null) {
            dto.setCustomerId(c.getCustomer().getId());
            dto.setCustomerName(c.getCustomer().getName());
            dto.setCustomerDisplayId(CustomerDTO.formatDisplayId(c.getCustomer().getId()));
        } else {
            dto.setCustomerId(c.getCustomerIdSnapshot());
            dto.setCustomerName(c.getCustomerNameSnapshot());
            dto.setCustomerDisplayId(CustomerDTO.formatDisplayId(c.getCustomerIdSnapshot()));
        }
        dto.setContractType(c.getContractType());
        dto.setPeriodFrom(c.getPeriodFrom());
        dto.setPeriodTo(c.getPeriodTo());
        dto.setSla(c.getSla());
        dto.setPmFrequency(c.getPmFrequency());
        dto.setPcbText(c.getPcbText());
        dto.setProductTypes(c.getProductTypes());
        dto.setPaymentTerms(c.getPaymentTerms());
        dto.setPaymentSide(c.getPaymentSide());
        dto.setPoNumber(c.getPoNumber());
        dto.setPoValue(c.getPoValue());
        dto.setPoBasicValue(c.getPoBasicValue());
        dto.setTaxPercent(c.getTaxPercent());
        dto.setTaxValue(c.getTaxValue());
        dto.setTotalPoValue(c.getTotalPoValue());
        dto.setSparesProvisionPercent(c.getSparesProvisionPercent());
        dto.setSparesProvisionValue(c.getSparesProvisionValue());
        dto.setClosed(c.isDeleted());
        dto.setCloseRemark(c.getCloseRemark());
        return dto;
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────

    @Override
    public ContractDTO addContract(ContractDTO dto) {
        Contract contract = toEntity(dto, new Contract());
        return toDTO(contractRepository.save(contract));
    }

    @Override
    public ContractDTO updateContract(Long id, ContractDTO dto) {
        Contract existing = contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found: " + id));
        if (existing.isDeleted()) {
            throw new RuntimeException("Contract not found: " + id);
        }
        return toDTO(contractRepository.save(toEntity(dto, existing)));
    }

    @Override
    @Transactional
    public void deleteContract(Long id, String closeRemark) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found: " + id));
        if (contract.isDeleted()) {
            throw new RuntimeException("Contract not found: " + id);
        }

        List<Complaint> linked = complaintRepository.findByContractId(id);
        boolean hasActive = linked.stream().anyMatch(c -> !"CLOSED".equalsIgnoreCase(c.getStatus()));
        if (hasActive) {
            throw new RuntimeException("Cannot delete contract while active complaints exist");
        }

        // Soft delete keeps CLOSED complaint history linked.
        String remark = closeRemark == null ? "" : closeRemark.trim();
        contract.setCloseRemark(remark.isEmpty() ? "-" : remark);
        contract.setDeleted(true);
        contractRepository.save(contract);
    }

    @Override
    public ContractDTO getContractById(Long id) {
        return toDTO(contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found: " + id)));
    }

    @Override
    public List<ContractDTO> getAllContracts() {
        return contractRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<ContractDTO> getContractsByCustomer(Long customerId) {
        return contractRepository.findByCustomerId(customerId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ContractDTO> getActiveContractsByCustomer(Long customerId) {
        return contractRepository.findActiveByCustomerId(customerId, LocalDate.now())
                .stream()
                .filter(c -> !c.isDeleted())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}