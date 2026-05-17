package com.crm.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CloseComplaintRequest {
    private String resolutionProofImage;
    private boolean sparesUsed;
    private String spareDetails;
    private Double spareCost;
}
