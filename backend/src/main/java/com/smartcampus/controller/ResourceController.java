package com.smartcampus.controller;

import com.smartcampus.dto.request.ResourceRequest;
import com.smartcampus.dto.request.ResourceStatusRequest;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.model.ResourceStatus;
import com.smartcampus.model.ResourceType;
import com.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC ENDPOINTS (no auth required — anyone can browse resources)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/resources
     * Search and filter resources with optional query parameters.
     * Supports pagination.
     *
     * @param type        filter by resource type (LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT)
     * @param status      filter by status (ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE)
     * @param location    partial match on location
     * @param building    partial match on building
     * @param minCapacity minimum seating capacity
     * @param keyword     full-text search across name, description, features
     * @param page        page number (0-based), default 0
     * @param size        page size, default 10
     */
    @GetMapping
    public ResponseEntity<PagedResponse<ResourceResponse>> searchResources(
            @RequestParam(required = false) ResourceType   type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) String         location,
            @RequestParam(required = false) String         building,
            @RequestParam(required = false) Integer        minCapacity,
            @RequestParam(required = false) String         keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(resourceService.searchResources(
                type, status, location, building, minCapacity, keyword, page, size));
    }

    /**
     * GET /api/resources/{id}
     * Get a single resource by its ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    /**
     * GET /api/resources/types
     * Returns all available resource type values — used by front-end dropdowns.
     */
    @GetMapping("/types")
    public ResponseEntity<List<String>> getResourceTypes() {
        List<String> types = Arrays.stream(ResourceType.values())
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    /**
     * GET /api/resources/by-type/{type}
     * Returns all ACTIVE resources of a specific type — used by booking form.
     */
    @GetMapping("/by-type/{type}")
    public ResponseEntity<List<ResourceResponse>> getByType(
            @PathVariable ResourceType type) {
        return ResponseEntity.ok(resourceService.getResourcesByType(type));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN-ONLY ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/resources
     * Create a new resource. ADMIN only.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> createResource(
            @Valid @RequestBody ResourceRequest request) {
        ResourceResponse created = resourceService.createResource(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/resources/{id}
     * Update all fields of an existing resource. ADMIN only.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.ok(resourceService.updateResource(id, request));
    }

    /**
     * PATCH /api/resources/{id}/status
     * Change only the status of a resource. ADMIN only.
     * e.g. mark OUT_OF_SERVICE without changing other fields.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ResourceStatusRequest request) {
        return ResponseEntity.ok(resourceService.updateStatus(id, request));
    }

    /**
     * DELETE /api/resources/{id}
     * Delete a resource. ADMIN only.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/resources/stats
     * Returns counts by status and type — for admin dashboard.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(resourceService.getResourceStats());
    }
}
