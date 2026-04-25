package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
    List<TicketAttachment> findByTicket(Ticket ticket);
}
