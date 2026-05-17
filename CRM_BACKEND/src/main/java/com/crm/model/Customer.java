package com.crm.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String organization;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String location;

    private String building;

    private String site;

    @Column(nullable = false,unique=true)
    private String phone;

    @Column(nullable = false, unique = true)
    private String email;

    /**
     * Legacy DB column; not written by the app. Use {@link CustomerDTO#getDisplayId()} in API responses.
     */
    @Column(name = "customer_uid", unique = true, length = 20, nullable = true, insertable = false, updatable = false)
    private String customerUid;

    @Column(nullable = false)
    private boolean deleted = false;
}