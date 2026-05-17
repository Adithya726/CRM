package com.crm.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RaiseComplaintRequest {
    private Long contractId;
    private String productType;
    private String description;
}
