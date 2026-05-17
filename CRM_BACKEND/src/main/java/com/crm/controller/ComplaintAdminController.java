package com.crm.controller;

import com.crm.model.CloseComplaintRequest;
import com.crm.model.ComplaintDTO;
import com.crm.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/complaints")
@CrossOrigin("*")
public class ComplaintAdminController {

    @Autowired
    private ComplaintService complaintService;

    @GetMapping("/open")
    public ResponseEntity<List<ComplaintDTO>> open() {
        return ResponseEntity.ok(complaintService.getOpenComplaints());
    }

    @GetMapping("/closed")
    public ResponseEntity<List<ComplaintDTO>> closed() {
        return ResponseEntity.ok(complaintService.getClosedComplaints());
    }

    @PutMapping("/{id}/assign/{engineerId}")
    public ResponseEntity<ComplaintDTO> assign(@PathVariable Long id, @PathVariable Long engineerId) {
        return ResponseEntity.ok(complaintService.assignEngineer(id, engineerId));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<ComplaintDTO> close(@PathVariable Long id, @RequestBody CloseComplaintRequest request) {
        return ResponseEntity.ok(complaintService.closeComplaint(id, request));
    }

    @PutMapping("/{id}/reopen")
    public ResponseEntity<ComplaintDTO> reopen(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.reopenComplaint(id));
    }
}
