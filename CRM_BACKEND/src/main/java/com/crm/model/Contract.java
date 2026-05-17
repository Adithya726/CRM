package com.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "contracts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = true)
    private Customer customer;

    /** Snapshot fields so closed contracts keep showing customer info after customer deletion. */
    private Long customerIdSnapshot;
    private String customerNameSnapshot;

    // AMC / NCAMC / PCB / Others
    @Column(nullable = false)
    private String contractType;

    private LocalDate periodFrom;
    private LocalDate periodTo;

    // SLA window for complaints (e.g. "0-4 hrs", "4-8 hrs", ...)
    private String sla;

    // Only for AMC / NCAMC
    private String pmFrequency;

    // Only for PCB / Others
    @Column(columnDefinition = "TEXT")
    private String pcbText;

    // Multi-select: CCTV, ACS, FAS, PAS, FFS — stored as comma-separated
    @ElementCollection
    @CollectionTable(name = "contract_product_types", joinColumns = @JoinColumn(name = "contract_id"))
    @Column(name = "product_type")
    private List<String> productTypes;

    // Advance / Arrears — stored as comma-separated
    @ElementCollection
    @CollectionTable(name = "contract_payment_terms", joinColumns = @JoinColumn(name = "contract_id"))
    @Column(name = "payment_term")
    private List<String> paymentTerms;

    // Quarterly / Half Yearly / Yearly
    private String paymentSide;

    private String poNumber;

    private Double poValue;

    private Double poBasicValue;

    private Double taxPercent;

    // Auto-calculated: poBasicValue * taxPercent / 100
    private Double taxValue;

    // Auto-calculated: poBasicValue + taxValue
    private Double totalPoValue;

    private Double sparesProvisionPercent;

    // Auto-calculated: poBasicValue * sparesProvisionPercent / 100
    private Double sparesProvisionValue;

    private String closeRemark;

    @Column(nullable = false)
    private boolean deleted = false;
}