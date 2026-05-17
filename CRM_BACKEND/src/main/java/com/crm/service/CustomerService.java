package com.crm.service;

import com.crm.model.Customer;
import com.crm.model.CustomerDTO;

import java.util.List;

public interface CustomerService {

    CustomerDTO addCustomer(Customer customer);

    CustomerDTO updateCustomer(Long id, Customer customer);

    void deleteCustomer(Long id);

    CustomerDTO getCustomerById(Long id);

    List<CustomerDTO> getAllCustomers();

    List<CustomerDTO> searchCustomersByName(String query);
}
