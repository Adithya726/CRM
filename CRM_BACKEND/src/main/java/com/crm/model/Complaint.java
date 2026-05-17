package com.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "customer_id", nullable = true)
    private Customer customer;

    /** Snapshot used when customer is later deleted. */
    private Long customerIdSnapshot;
    private String customerNameSnapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    /** Snapshot used when contract is later deleted. */
    @Column(name = "contract_type_snapshot")
    private String contractTypeSnapshot;

    @Column(nullable = false)
    private String productType;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private String status; // OPEN, ASSIGNED, CLOSED, REOPENED

    @Column(nullable = false)
    private LocalDateTime raisedAt;

    private LocalDateTime assignedAt;
    private LocalDateTime closedAt;
    private LocalDateTime previousAssignedAt;
    private LocalDateTime reassignedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engineer_id")
    private Engineer engineer;

    private String previousEngineerUsername;
    /** Phone of engineer before last reassignment (legacy detail for timeline synthesis). */
    private String previousEngineerPhone;

    @Column(nullable = false)
    private String sla;

    @Column(nullable = false)
    private boolean sparesUsed;

    @Column(length = 2000)
    private String spareDetails;

    private Double spareCost;

    @Column(length = 2000)
    private String resolutionProofImage;

    /** Append-only JSON array of engineer assignments (see ComplaintEngineerAssignmentDTO). */
    @Column(name = "engineer_assignments_json", columnDefinition = "TEXT")
    private String engineerAssignmentsJson;
}

