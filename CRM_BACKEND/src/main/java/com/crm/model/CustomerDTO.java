package com.crm.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * API view of a customer. {@link #displayId} is computed from {@link #id}; it is not persisted.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {

    private Long id;
    /** Format: 521 + zero-padded id (minimum 3 digits), e.g. id 1 → 521001 */
    private String displayId;

    private String name;
    private String organization;
    private String address;
    private String location;
    private String building;
    private String site;
    private String phone;
    private String email;

    public static String formatDisplayId(Long id) {
        if (id == null) {
            return null;
        }
        return "521" + String.format("%03d", id);
    }

    public static CustomerDTO fromEntity(Customer entity) {
        if (entity == null) {
            return null;
        }
        CustomerDTO dto = new CustomerDTO();
        dto.setId(entity.getId());
        dto.setDisplayId(formatDisplayId(entity.getId()));
        dto.setName(entity.getName());
        dto.setOrganization(entity.getOrganization());
        dto.setAddress(entity.getAddress());
        dto.setLocation(entity.getLocation());
        dto.setBuilding(entity.getBuilding());
        dto.setSite(entity.getSite());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        return dto;
    }
}
