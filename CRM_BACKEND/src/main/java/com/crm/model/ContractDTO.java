package com.crm.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO used for both request body (create/update) and response.
 * Avoids lazy-load / circular-reference issues with the JPA entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor

public class ContractDTO {

    private Long id;
    private Long customerId;
    private String customerName;
    /** Populated on read; {@link CustomerDTO#formatDisplayId(Long)}. */
    private String customerDisplayId;

    private String contractType;

    private LocalDate periodFrom;
    private LocalDate periodTo;

    private String sla;

    private String pmFrequency;
    private String pcbText;

    private List<String> productTypes;
    private List<String> paymentTerms;
    private String paymentSide;

    private String poNumber;

    private Double poValue;
    private Double poBasicValue;
    private Double taxPercent;
    private Double taxValue;
    private Double totalPoValue;
    private Double sparesProvisionPercent;
    private Double sparesProvisionValue;
    private boolean closed;
    private String closeRemark;
}