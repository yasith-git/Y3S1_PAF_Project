package com.smartcampus.service.impl;

import com.smartcampus.dto.request.BookingRequest;
import com.smartcampus.dto.request.BookingStatusRequest;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.exception.AccessDeniedException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.*;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.BookingService;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository   bookingRepo;
    private final ResourceRepository  resourceRepo;
    private final UserRepository      userRepo;
    private final NotificationService notificationService;

    // ── Create ────────────────────────────────────────────────────────────────
    @Override
    public BookingResponse createBooking(BookingRequest req, String userEmail) {
        User user = findUser(userEmail);
        Resource resource = resourceRepo.findById(req.getResourceId())
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + req.getResourceId()));

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new IllegalArgumentException("Resource is not available for booking");
        }
        if (req.getEndTime().isBefore(req.getStartTime()) || req.getEndTime().equals(req.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        if (bookingRepo.hasConflict(resource, req.getStartTime(), req.getEndTime(), null)) {
            throw new IllegalArgumentException("The requested time slot conflicts with an existing booking");
        }

        Booking booking = Booking.builder()
            .user(user)
            .resource(resource)
            .startTime(req.getStartTime())
            .endTime(req.getEndTime())
            .purpose(req.getPurpose())
            .status(BookingStatus.PENDING)
            .build();

        booking = bookingRepo.save(booking);

        notificationService.send(user,
            "Your booking for \"" + resource.getName() + "\" is under review.",
            NotificationType.BOOKING_APPROVED, booking.getId().toString());

        return BookingResponse.from(booking);
    }

    // ── Read ──────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public PagedResponse<BookingResponse> getMyBookings(String userEmail, Pageable pageable) {
        User user = findUser(userEmail);
        Page<Booking> page = bookingRepo.findByUserOrderByCreatedAtDesc(user, pageable);
        return PagedResponse.of(page.map(BookingResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<BookingResponse> getAllBookings(String statusFilter, Pageable pageable) {
        Page<Booking> page;
        if (statusFilter != null && !statusFilter.isBlank()) {
            BookingStatus status = BookingStatus.valueOf(statusFilter.toUpperCase());
            page = bookingRepo.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            page = bookingRepo.findAllByOrderByCreatedAtDesc(pageable);
        }
        return PagedResponse.of(page.map(BookingResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id, String userEmail) {
        Booking booking = findBooking(id);
        User user = findUser(userEmail);
        if (!booking.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Not authorised to view this booking");
        }
        return BookingResponse.from(booking);
    }

    // ── Admin: approve / reject ───────────────────────────────────────────────
    @Override
    public BookingResponse updateBookingStatus(Long id, BookingStatusRequest req, String adminEmail) {
        Booking booking = findBooking(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only PENDING bookings can be approved or rejected");
        }

        booking.setStatus(req.getStatus());
        booking.setAdminNote(req.getAdminNote());
        booking = bookingRepo.save(booking);

        NotificationType type = req.getStatus() == BookingStatus.APPROVED
            ? NotificationType.BOOKING_APPROVED
            : NotificationType.BOOKING_REJECTED;

        String msg = req.getStatus() == BookingStatus.APPROVED
            ? "Your booking for \"" + booking.getResource().getName() + "\" has been approved!"
            : "Your booking for \"" + booking.getResource().getName() + "\" was rejected." +
              (req.getAdminNote() != null ? " Note: " + req.getAdminNote() : "");

        notificationService.send(booking.getUser(), msg, type, booking.getId().toString());

        return BookingResponse.from(booking);
    }

    // ── Cancel (by owner or admin) ────────────────────────────────────────────
    @Override
    public void cancelBooking(Long id, String userEmail) {
        Booking booking = findBooking(id);
        User user = findUser(userEmail);

        boolean isOwner = booking.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Not authorised to cancel this booking");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepo.save(booking);

        if (!isOwner) {
            notificationService.send(booking.getUser(),
                "Your booking for \"" + booking.getResource().getName() + "\" was cancelled by admin.",
                NotificationType.BOOKING_CANCELLED, booking.getId().toString());
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getBookingStats() {
        return Map.of(
            "PENDING",   bookingRepo.countByStatus(BookingStatus.PENDING),
            "APPROVED",  bookingRepo.countByStatus(BookingStatus.APPROVED),
            "REJECTED",  bookingRepo.countByStatus(BookingStatus.REJECTED),
            "CANCELLED", bookingRepo.countByStatus(BookingStatus.CANCELLED)
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private User findUser(String email) {
        return userRepo.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Booking findBooking(Long id) {
        return bookingRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));
    }
}
