package com.smartcampus.repository;

import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;
import com.smartcampus.model.Resource;
import com.smartcampus.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // ── User queries ──────────────────────────────────────────────────────────
    Page<Booking> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<Booking> findByUserAndStatusIn(User user, List<BookingStatus> statuses);

    // ── Admin queries ─────────────────────────────────────────────────────────
    Page<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status, Pageable pageable);

    // ── Conflict detection ────────────────────────────────────────────────────
    /**
     * Returns true if the resource has an APPROVED or PENDING booking that
     * overlaps the requested [startTime, endTime] window.
     * Overlap condition: existing.start < requested.end AND existing.end > requested.start
     */
    @Query("""
            SELECT COUNT(b) > 0
            FROM Booking b
            WHERE b.resource = :resource
              AND b.status IN ('PENDING', 'APPROVED')
              AND b.startTime < :endTime
              AND b.endTime   > :startTime
              AND (:excludeId IS NULL OR b.id <> :excludeId)
            """)
    boolean hasConflict(
        @Param("resource")  Resource resource,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime")   LocalDateTime endTime,
        @Param("excludeId") Long excludeId
    );

    // ── Stats ─────────────────────────────────────────────────────────────────
    long countByStatus(BookingStatus status);

    long countByUser(User user);
}
