package com.crm.controller;

import com.crm.model.ContractDTO;
import com.crm.model.ComplaintDTO;
import com.crm.model.CustomerDTO;
import com.crm.service.ComplaintService;
import com.crm.service.ContractService;
import com.crm.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Operator endpoints — customers/contracts are read-only; complaints can be raised/viewed.
 */
@RestController
@RequestMapping("/api/operator")
@CrossOrigin("*")
public class OperatorController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private ContractService contractService;

    @Autowired
    private ComplaintService complaintService;

    // ══════════════════════════════════════════
    //  CUSTOMER — VIEW ONLY
    // ══════════════════════════════════════════

    /** GET /api/operator/customers — View all customers */
    @GetMapping("/customers")
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    /** GET /api/operator/customers/{id} — View single customer */
    @GetMapping("/customers/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    /** GET /api/operator/customers/search?q= — typeahead search */
    @GetMapping("/customers/search")
    public ResponseEntity<List<CustomerDTO>> searchCustomers(@RequestParam("q") String q) {
        return ResponseEntity.ok(customerService.searchCustomersByName(q));
    }

    // ══════════════════════════════════════════
    //  CONTRACT — VIEW ONLY
    // ══════════════════════════════════════════

    /** GET /api/operator/contracts — View all contracts */
    @GetMapping("/contracts")
    public ResponseEntity<List<ContractDTO>> getAllContracts() {
        return ResponseEntity.ok(contractService.getAllContracts());
    }

    /** GET /api/operator/contracts/{id} — View single contract */
    @GetMapping("/contracts/{id}")
    public ResponseEntity<ContractDTO> getContractById(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }

    /** GET /api/operator/contracts/customer/{customerId} — Contracts for a customer */
    @GetMapping("/contracts/customer/{customerId}")
    public ResponseEntity<List<ContractDTO>> getContractsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(contractService.getContractsByCustomer(customerId));
    }

    /** GET /api/operator/contracts/customer/{customerId}/active — ACTIVE contracts only */
    @GetMapping("/contracts/customer/{customerId}/active")
    public ResponseEntity<List<ContractDTO>> getActiveContractsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(contractService.getActiveContractsByCustomer(customerId));
    }

    // ══════════════════════════════════════════
    //  COMPLAINT
    // ══════════════════════════════════════════

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintDTO>> listComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }
}