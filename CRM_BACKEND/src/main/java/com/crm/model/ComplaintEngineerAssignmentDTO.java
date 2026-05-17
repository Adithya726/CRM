package com.crm.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintEngineerAssignmentDTO {
    private Long engineerId;
    private String engineerUsername;
    private String engineerPhone;
    private LocalDateTime assignedAt;
}
