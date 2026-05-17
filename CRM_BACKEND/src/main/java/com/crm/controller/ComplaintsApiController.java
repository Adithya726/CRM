package com.crm.controller;

import com.crm.model.ComplaintDTO;
import com.crm.model.UnifiedRaiseComplaintRequest;
import com.crm.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin("*")
public class ComplaintsApiController {

    @Autowired
    private ComplaintService complaintService;

    /** Unified raise endpoint for Admin and Operator */
    @PostMapping
    public ResponseEntity<ComplaintDTO> raise(@RequestBody UnifiedRaiseComplaintRequest request) {
        return ResponseEntity.ok(complaintService.raiseComplaintUnified(request));
    }
}
