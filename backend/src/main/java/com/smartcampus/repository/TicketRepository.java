package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketStatus;
import com.smartcampus.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByReporterOrderByCreatedAtDesc(User reporter);

    List<Ticket> findByAssigneeOrderByCreatedAtDesc(User assignee);

    Page<Ticket> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Ticket> findByStatusOrderByCreatedAtDesc(TicketStatus status, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%',:keyword,'%')) " +
           "  OR LOWER(t.description) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Ticket> search(@Param("status") TicketStatus status,
                        @Param("priority") com.smartcampus.model.TicketPriority priority,
                        @Param("keyword") String keyword,
                        Pageable pageable);

    long countByStatus(TicketStatus status);
}
