package com.crm.service;

import com.crm.model.CloseComplaintRequest;
import com.crm.model.ComplaintDTO;
import com.crm.model.RaiseComplaintRequest;
import com.crm.model.UnifiedRaiseComplaintRequest;

import java.util.List;

public interface ComplaintService {
    ComplaintDTO raiseComplaint(RaiseComplaintRequest request);

    ComplaintDTO raiseComplaintUnified(UnifiedRaiseComplaintRequest request);

    ComplaintDTO assignEngineer(Long complaintId, Long engineerId);

    ComplaintDTO closeComplaint(Long complaintId, CloseComplaintRequest request);

    ComplaintDTO reopenComplaint(Long complaintId);

    List<ComplaintDTO> getOpenComplaints();

    List<ComplaintDTO> getClosedComplaints();

    List<ComplaintDTO> getAllComplaints();
}
