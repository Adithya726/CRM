package com.crm.service;

import com.crm.model.*;
import com.crm.repository.ComplaintRepository;
import com.crm.repository.ContractRepository;
import com.crm.repository.CustomerRepository;
import com.crm.repository.EngineerRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ComplaintServiceImpl implements ComplaintService {

    private static final ObjectMapper ASSIGNMENT_JSON = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public static final String OPEN = "OPEN";
    public static final String ASSIGNED = "ASSIGNED";
    public static final String CLOSED = "CLOSED";
    public static final String REOPENED = "REOPENED";

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EngineerRepository engineerRepository;

    private boolean isActiveContract(Contract c, LocalDate today) {
        return c.getPeriodFrom() != null
                && c.getPeriodTo() != null
                && !today.isBefore(c.getPeriodFrom())
                && !today.isAfter(c.getPeriodTo());
    }

    private List<ComplaintEngineerAssignmentDTO> parseAssignmentsFromJson(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return ASSIGNMENT_JSON.readValue(json, new TypeReference<List<ComplaintEngineerAssignmentDTO>>() {});
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private List<ComplaintEngineerAssignmentDTO> buildLegacyAssignmentTimeline(Complaint x) {
        List<ComplaintEngineerAssignmentDTO> list = new ArrayList<>();
        if (x.getPreviousEngineerUsername() != null && x.getPreviousAssignedAt() != null) {
            ComplaintEngineerAssignmentDTO prev = new ComplaintEngineerAssignmentDTO();
            prev.setEngineerUsername(x.getPreviousEngineerUsername());
            prev.setEngineerPhone(x.getPreviousEngineerPhone());
            prev.setAssignedAt(x.getPreviousAssignedAt());
            list.add(prev);
        }
        if (x.getEngineer() != null && x.getAssignedAt() != null) {
            ComplaintEngineerAssignmentDTO cur = new ComplaintEngineerAssignmentDTO();
            cur.setEngineerId(x.getEngineer().getId());
            cur.setEngineerUsername(x.getEngineer().getUsername());
            cur.setEngineerPhone(x.getEngineer().getPhone());
            cur.setAssignedAt(x.getAssignedAt());
            list.add(cur);
        }
        return list;
    }

    /** Stored JSON if present; otherwise infer from legacy previous/current engineer columns. */
    private List<ComplaintEngineerAssignmentDTO> computeAssignmentTimeline(Complaint x) {
        List<ComplaintEngineerAssignmentDTO> fromJson = parseAssignmentsFromJson(x.getEngineerAssignmentsJson());
        if (!fromJson.isEmpty()) {
            return new ArrayList<>(fromJson);
        }
        return buildLegacyAssignmentTimeline(x);
    }

    private void appendEngineerAssignment(Complaint c, Engineer e, LocalDateTime at) {
        List<ComplaintEngineerAssignmentDTO> timeline = computeAssignmentTimeline(c);
        if (!timeline.isEmpty()) {
            ComplaintEngineerAssignmentDTO last = timeline.get(timeline.size() - 1);
            if (Objects.equals(last.getEngineerId(), e.getId())) {
                return;
            }
        }
        timeline.add(new ComplaintEngineerAssignmentDTO(e.getId(), e.getUsername(), e.getPhone(), at));
        try {
            c.setEngineerAssignmentsJson(ASSIGNMENT_JSON.writeValueAsString(timeline));
        } catch (Exception ex) {
            throw new RuntimeException("Failed to persist engineer assignment history", ex);
        }
    }

    private void hydrateEngineerPhones(List<ComplaintEngineerAssignmentDTO> list) {
        if (list == null || list.isEmpty()) {
            return;
        }
        for (ComplaintEngineerAssignmentDTO dto : list) {
            String ph = dto.getEngineerPhone();
            if (ph != null && !ph.isBlank()) {
                continue;
            }
            if (dto.getEngineerId() != null) {
                engineerRepository.findById(dto.getEngineerId()).ifPresent(eng -> dto.setEngineerPhone(eng.getPhone()));
            }
            ph = dto.getEngineerPhone();
            if (ph != null && !ph.isBlank()) {
                continue;
            }
            String username = dto.getEngineerUsername();
            if (username != null && !username.isBlank()) {
                engineerRepository.findByUsername(username.trim()).ifPresent(eng -> {
                    dto.setEngineerPhone(eng.getPhone());
                    if (dto.getEngineerId() == null) {
                        dto.setEngineerId(eng.getId());
                    }
                });
            }
        }
    }

    private ComplaintDTO toDTO(Complaint x) {
        ComplaintDTO dto = new ComplaintDTO();
        dto.setId(x.getId());
        if (x.getCustomer() != null) {
            dto.setCustomerId(x.getCustomer().getId());
            dto.setCustomerName(x.getCustomer().getName());
            dto.setCustomerDisplayId(CustomerDTO.formatDisplayId(x.getCustomer().getId()));
        } else {
            dto.setCustomerId(x.getCustomerIdSnapshot());
            dto.setCustomerName(x.getCustomerNameSnapshot());
            dto.setCustomerDisplayId(CustomerDTO.formatDisplayId(x.getCustomerIdSnapshot()));
        }
        dto.setContractId(x.getContract() != null ? x.getContract().getId() : null);
        dto.setContractType(x.getContract() != null ? x.getContract().getContractType() : x.getContractTypeSnapshot());
        dto.setProductType(x.getProductType());
        dto.setDescription(x.getDescription());
        dto.setStatus(x.getStatus());
        dto.setRaisedAt(x.getRaisedAt());
        dto.setAssignedAt(x.getAssignedAt());
        dto.setClosedAt(x.getClosedAt());
        if (x.getEngineer() != null) {
            dto.setEngineerId(x.getEngineer().getId());
            dto.setEngineerUsername(x.getEngineer().getUsername());
            dto.setEngineerPhone(x.getEngineer().getPhone());
        }
        dto.setPreviousEngineerUsername(x.getPreviousEngineerUsername());
        dto.setPreviousEngineerPhone(x.getPreviousEngineerPhone());
        dto.setPreviousAssignedAt(x.getPreviousAssignedAt());
        dto.setReassignedAt(x.getReassignedAt());
        List<ComplaintEngineerAssignmentDTO> timeline = computeAssignmentTimeline(x);
        hydrateEngineerPhones(timeline);
        dto.setEngineerAssignments(timeline);
        dto.setSla(x.getSla());
        dto.setSparesUsed(x.isSparesUsed());
        dto.setSpareDetails(x.getSpareDetails());
        dto.setSpareCost(x.getSpareCost());
        dto.setResolutionProofImage(x.getResolutionProofImage());
        return dto;
    }

    @Override
    @Transactional
    public ComplaintDTO raiseComplaint(RaiseComplaintRequest request) {
        if (request == null || request.getContractId() == null) {
            throw new RuntimeException("contractId is required");
        }
        if (request.getProductType() == null || request.getProductType().isBlank()) {
            throw new RuntimeException("productType is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new RuntimeException("description is required");
        }

        Contract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new RuntimeException("Contract not found: " + request.getContractId()));
        if (contract.isDeleted()) {
            throw new RuntimeException("Contract not found: " + request.getContractId());
        }
        if (contract.getCustomer() == null) {
            throw new RuntimeException("Contract customer not found");
        }

        LocalDate today = LocalDate.now();
        if (!isActiveContract(contract, today)) {
            throw new RuntimeException("Contract is not ACTIVE for the current date");
        }

        if (contract.getSla() == null || contract.getSla().isBlank()) {
            throw new RuntimeException("Contract SLA is not configured");
        }

        List<String> allowed = contract.getProductTypes();
        if (allowed == null || allowed.isEmpty()) {
            throw new RuntimeException("Contract has no product types configured");
        }
        String product = request.getProductType().trim();
        boolean ok = allowed.stream().anyMatch(p -> Objects.equals(p, product));
        if (!ok) {
            throw new RuntimeException("productType must be one of the contract product types");
        }

        Complaint c = new Complaint();
        if (contract.getCustomer() == null) {
            throw new RuntimeException("Contract customer not found");
        }
        c.setCustomer(contract.getCustomer());
        c.setCustomerIdSnapshot(contract.getCustomer().getId());
        c.setCustomerNameSnapshot(contract.getCustomer().getName());
        c.setContract(contract);
        c.setContractTypeSnapshot(contract.getContractType());
        c.setProductType(product);
        c.setDescription(request.getDescription().trim());
        c.setStatus(OPEN);
        c.setRaisedAt(LocalDateTime.now());
        c.setSla(contract.getSla().trim());
        c.setSparesUsed(false);
        c.setSpareDetails(null);
        c.setSpareCost(null);
        c.setResolutionProofImage(null);

        return toDTO(complaintRepository.save(c));
    }

    @Override
    @Transactional
    public ComplaintDTO raiseComplaintUnified(UnifiedRaiseComplaintRequest req) {
        if (req == null || req.getCustomerId() == null) {
            throw new RuntimeException("customerId is required");
        }
        if (req.getContractId() == null) {
            throw new RuntimeException("contractId is required");
        }
        customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found: " + req.getCustomerId()));

        Contract contract = contractRepository.findById(req.getContractId())
                .orElseThrow(() -> new RuntimeException("Contract not found: " + req.getContractId()));
        if (contract.isDeleted()) {
            throw new RuntimeException("Contract not found: " + req.getContractId());
        }

        if (contract.getCustomer() == null) {
            throw new RuntimeException("Contract customer not found");
        }
        if (!contract.getCustomer().getId().equals(req.getCustomerId())) {
            throw new RuntimeException("Contract does not belong to the selected customer");
        }

        RaiseComplaintRequest inner = new RaiseComplaintRequest(
                req.getContractId(),
                req.getProductType(),
                req.getDescription()
        );
        return raiseComplaint(inner);
    }

    @Override
    @Transactional
    public ComplaintDTO assignEngineer(Long complaintId, Long engineerId) {
        Complaint c = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));
        if (Objects.equals(c.getStatus(), CLOSED)) {
            throw new RuntimeException("Cannot assign a closed complaint");
        }
        Engineer e = engineerRepository.findById(engineerId)
                .orElseThrow(() -> new RuntimeException("Engineer not found: " + engineerId));

        LocalDateTime now = LocalDateTime.now();
        boolean engineerChanging = c.getEngineer() == null || !Objects.equals(c.getEngineer().getId(), e.getId());

        if (engineerChanging) {
            if (c.getEngineer() != null && !Objects.equals(c.getEngineer().getId(), e.getId())) {
                c.setPreviousEngineerUsername(c.getEngineer().getUsername());
                c.setPreviousEngineerPhone(c.getEngineer().getPhone());
                c.setPreviousAssignedAt(c.getAssignedAt());
                c.setReassignedAt(now);
            } else if (c.getEngineer() == null) {
                c.setPreviousEngineerUsername(null);
                c.setPreviousEngineerPhone(null);
                c.setPreviousAssignedAt(null);
                c.setReassignedAt(null);
            }
            appendEngineerAssignment(c, e, now);
        }
        c.setEngineer(e);
        c.setAssignedAt(now);
        c.setStatus(ASSIGNED);
        return toDTO(complaintRepository.save(c));
    }

    @Override
    @Transactional
    public ComplaintDTO closeComplaint(Long complaintId, CloseComplaintRequest request) {
        Complaint c = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));
        if (request == null) {
            throw new RuntimeException("Request body is required");
        }
        if (request.getResolutionProofImage() == null || request.getResolutionProofImage().isBlank()) {
            throw new RuntimeException("resolutionProofImage is required");
        }

        if (!(Objects.equals(c.getStatus(), ASSIGNED) || Objects.equals(c.getStatus(), REOPENED))) {
            throw new RuntimeException("Complaint must be ASSIGNED or REOPENED before closing");
        }

        c.setResolutionProofImage(request.getResolutionProofImage().trim());
        c.setSparesUsed(request.isSparesUsed());

        if (request.isSparesUsed()) {
            if (request.getSpareDetails() == null || request.getSpareDetails().isBlank()) {
                throw new RuntimeException("spareDetails is required when sparesUsed=true");
            }
            if (request.getSpareCost() == null) {
                throw new RuntimeException("spareCost is required when sparesUsed=true");
            }
            c.setSpareDetails(request.getSpareDetails().trim());
            c.setSpareCost(request.getSpareCost());
        } else {
            c.setSpareDetails(null);
            c.setSpareCost(null);
        }

        c.setClosedAt(LocalDateTime.now());
        c.setStatus(CLOSED);
        return toDTO(complaintRepository.save(c));
    }

    @Override
    @Transactional
    public ComplaintDTO reopenComplaint(Long complaintId) {
        Complaint c = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));
        if (!Objects.equals(c.getStatus(), CLOSED)) {
            throw new RuntimeException("Only CLOSED complaints can be reopened");
        }
        c.setStatus(REOPENED);
        c.setClosedAt(null);
        c.setResolutionProofImage(null);
        c.setSparesUsed(false);
        c.setSpareDetails(null);
        c.setSpareCost(null);
        return toDTO(complaintRepository.save(c));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintDTO> getOpenComplaints() {
        return Stream.of(OPEN, ASSIGNED, REOPENED)
                .flatMap(s -> complaintRepository.findByStatus(s).stream())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintDTO> getClosedComplaints() {
        return complaintRepository.findByStatus(CLOSED).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintDTO> getAllComplaints() {
        return complaintRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }
}
