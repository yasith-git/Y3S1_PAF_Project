package com.smartcampus.service;

import com.smartcampus.dto.request.ResourceRequest;
import com.smartcampus.dto.request.ResourceStatusRequest;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.model.ResourceStatus;
import com.smartcampus.model.ResourceType;

import java.util.List;
import java.util.Map;

public interface ResourceService {

    // ── CRUD ──────────────────────────────────────────────────────────────────
    ResourceResponse createResource(ResourceRequest request);
    ResourceResponse getResourceById(Long id);
    ResourceResponse updateResource(Long id, ResourceRequest request);
    ResourceResponse updateStatus(Long id, ResourceStatusRequest request);
    void deleteResource(Long id);

    // ── Search / Filter ───────────────────────────────────────────────────────
    PagedResponse<ResourceResponse> searchResources(
            ResourceType type,
            ResourceStatus status,
            String location,
            String building,
            Integer minCapacity,
            String keyword,
            int page,
            int size
    );

    // ── Utility ───────────────────────────────────────────────────────────────
    List<ResourceResponse> getResourcesByType(ResourceType type);
    Map<String, Long> getResourceStats();
}
