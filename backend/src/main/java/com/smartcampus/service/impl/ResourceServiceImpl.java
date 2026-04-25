package com.smartcampus.service.impl;

import com.smartcampus.dto.request.ResourceRequest;
import com.smartcampus.dto.request.ResourceStatusRequest;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Resource;
import com.smartcampus.model.ResourceStatus;
import com.smartcampus.model.ResourceType;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    @Override
    @Transactional
    public ResourceResponse createResource(ResourceRequest request) {
        if (resourceRepository.existsByNameIgnoreCaseAndLocation(
                request.getName(), request.getLocation())) {
            throw new IllegalArgumentException(
                    "A resource named '" + request.getName() +
                    "' already exists at location '" + request.getLocation() + "'");
        }

        Resource resource = Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(request.getLocation())
                .building(request.getBuilding())
                .availabilityWindows(request.getAvailabilityWindows())
                .status(request.getStatus() != null ? request.getStatus() : ResourceStatus.ACTIVE)
                .description(request.getDescription())
                .features(request.getFeatures())
                .imageUrl(request.getImageUrl())
                .build();

        return ResourceResponse.from(resourceRepository.save(resource));
    }

    @Override
    public ResourceResponse getResourceById(Long id) {
        return ResourceResponse.from(findById(id));
    }

    @Override
    @Transactional
    public ResourceResponse updateResource(Long id, ResourceRequest request) {
        Resource resource = findById(id);

        // Check duplicate name/location only if either changed
        boolean nameChanged     = !resource.getName().equalsIgnoreCase(request.getName());
        boolean locationChanged = !resource.getLocation().equals(request.getLocation());
        if ((nameChanged || locationChanged) &&
                resourceRepository.existsByNameIgnoreCaseAndLocation(
                        request.getName(), request.getLocation())) {
            throw new IllegalArgumentException(
                    "A resource named '" + request.getName() +
                    "' already exists at location '" + request.getLocation() + "'");
        }

        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation());
        resource.setBuilding(request.getBuilding());
        resource.setAvailabilityWindows(request.getAvailabilityWindows());
        resource.setDescription(request.getDescription());
        resource.setFeatures(request.getFeatures());
        resource.setImageUrl(request.getImageUrl());
        if (request.getStatus() != null) {
            resource.setStatus(request.getStatus());
        }

        return ResourceResponse.from(resourceRepository.save(resource));
    }

    @Override
    @Transactional
    public ResourceResponse updateStatus(Long id, ResourceStatusRequest request) {
        Resource resource = findById(id);
        resource.setStatus(request.getStatus());
        return ResourceResponse.from(resourceRepository.save(resource));
    }

    @Override
    @Transactional
    public void deleteResource(Long id) {
        Resource resource = findById(id);
        resourceRepository.delete(resource);
    }

    @Override
    public PagedResponse<ResourceResponse> searchResources(
            ResourceType type, ResourceStatus status,
            String location, String building,
            Integer minCapacity, String keyword,
            int page, int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Resource> resultPage = resourceRepository.search(
                type, status, location, building, minCapacity, keyword, pageable);

        List<ResourceResponse> content = resultPage.getContent()
                .stream()
                .map(ResourceResponse::from)
                .collect(Collectors.toList());

        return PagedResponse.<ResourceResponse>builder()
                .content(content)
                .page(resultPage.getNumber())
                .size(resultPage.getSize())
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .last(resultPage.isLast())
                .build();
    }

    @Override
    public List<ResourceResponse> getResourcesByType(ResourceType type) {
        return resourceRepository
                .findByTypeAndStatusOrderByNameAsc(type, ResourceStatus.ACTIVE)
                .stream()
                .map(ResourceResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Long> getResourceStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        // By status
        stats.put("total",           resourceRepository.count());
        stats.put("active",          resourceRepository.countByStatus(ResourceStatus.ACTIVE));
        stats.put("outOfService",    resourceRepository.countByStatus(ResourceStatus.OUT_OF_SERVICE));
        stats.put("underMaintenance",resourceRepository.countByStatus(ResourceStatus.UNDER_MAINTENANCE));
        // By type
        Arrays.stream(ResourceType.values()).forEach(t ->
                stats.put("type_" + t.name().toLowerCase(),
                        resourceRepository.countByType(t)));
        return stats;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Resource findById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));
    }
}
