package com.crm.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintDTO {
    private Long id;

    private Long customerId;
    private String customerName;
    private String customerDisplayId;

    private Long contractId;
    private String contractType;

    private String productType;
    private String description;
    private String status;

    private LocalDateTime raisedAt;
    private LocalDateTime assignedAt;
    private LocalDateTime closedAt;

    private Long engineerId;
    private String engineerUsername;
    private String engineerPhone;
    private String previousEngineerUsername;
    private String previousEngineerPhone;
    private LocalDateTime previousAssignedAt;
    private LocalDateTime reassignedAt;

    /** Chronological list of engineer assignments for this complaint. */
    private List<ComplaintEngineerAssignmentDTO> engineerAssignments;

    private String sla;

    private boolean sparesUsed;
    private String spareDetails;
    private Double spareCost;

    private String resolutionProofImage;
}
