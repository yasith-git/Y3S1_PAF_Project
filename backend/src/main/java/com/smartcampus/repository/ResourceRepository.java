package com.smartcampus.repository;

import com.smartcampus.model.Resource;
import com.smartcampus.model.ResourceStatus;
import com.smartcampus.model.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    /**
     * Multi-criteria search with optional filters.
     * All parameters are optional (null means "no filter").
     */
    @Query("""
        SELECT r FROM Resource r
        WHERE (:type     IS NULL OR r.type     = :type)
          AND (:status   IS NULL OR r.status   = :status)
          AND (:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%')))
          AND (:building IS NULL OR LOWER(r.building) LIKE LOWER(CONCAT('%', :building, '%')))
          AND (:minCapacity IS NULL OR r.capacity >= :minCapacity)
          AND (:keyword  IS NULL
               OR LOWER(r.name)        LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(r.features)    LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY r.name ASC
    """)
    Page<Resource> search(
            @Param("type")        ResourceType   type,
            @Param("status")      ResourceStatus status,
            @Param("location")    String         location,
            @Param("building")    String         building,
            @Param("minCapacity") Integer        minCapacity,
            @Param("keyword")     String         keyword,
            Pageable pageable
    );

    /** Returns all ACTIVE resources of a given type — used by Booking module */
    List<Resource> findByTypeAndStatusOrderByNameAsc(ResourceType type, ResourceStatus status);

    /** Existence check to prevent duplicate names in same location */
    boolean existsByNameIgnoreCaseAndLocation(String name, String location);

    /** Count by status — for admin dashboard */
    long countByStatus(ResourceStatus status);

    /** Count by type */
    long countByType(ResourceType type);
}
