package com.crm.service;

import com.crm.model.Customer;
import com.crm.model.CustomerDTO;
import com.crm.model.Contract;
import com.crm.repository.ContractRepository;
import com.crm.repository.ComplaintRepository;
import com.crm.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Override
    public CustomerDTO addCustomer(Customer customer) {
        if (customerRepository.existsByEmail(customer.getEmail())) {
            throw new RuntimeException("A customer with this email already exists.");
        }
        if (customer.getPhone() != null && customerRepository.existsByPhone(customer.getPhone())) {
            throw new RuntimeException("A customer with this phone number already exists.");
        }
        Customer saved = customerRepository.save(customer);
        return CustomerDTO.fromEntity(saved);
    }

    @Override
    public CustomerDTO updateCustomer(Long id, Customer updated) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        if (existing.isDeleted()) {
            throw new RuntimeException("Customer not found with id: " + id);
        }

        existing.setName(updated.getName());
        existing.setOrganization(updated.getOrganization());
        existing.setAddress(updated.getAddress());
        existing.setLocation(updated.getLocation());
        existing.setBuilding(updated.getBuilding());
        existing.setSite(updated.getSite());
        if (updated.getPhone() != null
                && !updated.getPhone().equals(existing.getPhone())
                && customerRepository.existsByPhone(updated.getPhone())) {
            throw new RuntimeException("A customer with this phone number already exists.");
        }
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());

        return CustomerDTO.fromEntity(customerRepository.save(existing));
    }

    @Override
    public void deleteCustomer(Long id) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        // Even if marked deleted, we still hard-delete the DB row and preserve history via snapshots.

        LocalDate today = LocalDate.now();
        boolean hasOpenContracts = contractRepository.findByCustomerId(id).stream().anyMatch(c -> {
            if (c.isDeleted()) return false; // manually closed contract
            if (c.getPeriodTo() != null && c.getPeriodTo().isBefore(today)) return false; // AMC ended
            return true;
        });
        if (hasOpenContracts) {
            throw new RuntimeException("Cannot delete customer while active contracts exist");
        }

        // Detach contracts/complaints so we can hard-delete the customer row
        // while preserving history via snapshots.
        List<Contract> contracts = contractRepository.findByCustomerId(id);
        for (Contract c : contracts) {
            c.setCustomer(null);
            c.setCustomerIdSnapshot(existing.getId());
            c.setCustomerNameSnapshot(existing.getName());
            contractRepository.save(c);
        }

        List<com.crm.model.Complaint> complaints = complaintRepository.findByCustomerId(id);
        for (com.crm.model.Complaint comp : complaints) {
            comp.setCustomer(null);
            comp.setCustomerIdSnapshot(existing.getId());
            comp.setCustomerNameSnapshot(existing.getName());
        }
        complaintRepository.saveAll(complaints);

        customerRepository.deleteById(id);
    }

    @Override
    public CustomerDTO getCustomerById(Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        if (c.isDeleted()) {
            throw new RuntimeException("Customer not found with id: " + id);
        }
        return CustomerDTO.fromEntity(c);
    }

    @Override
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .filter(c -> !c.isDeleted())
                .map(CustomerDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomerDTO> searchCustomersByName(String query) {
        if (query == null) {
            return Collections.emptyList();
        }
        String q = query.trim();
        if (q.length() < 2) {
            return Collections.emptyList();
        }
        return customerRepository.findTop20ByNameContainingIgnoreCaseOrderByNameAsc(q).stream()
                .filter(c -> !c.isDeleted())
                .map(CustomerDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
