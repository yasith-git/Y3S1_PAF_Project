package com.smartcampus.controller;

import com.smartcampus.dto.request.BookingRequest;
import com.smartcampus.dto.request.BookingStatusRequest;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ── User endpoints ────────────────────────────────────────────────────────

    /** POST /api/bookings — create a new booking */
    @PostMapping
    public ResponseEntity<BookingResponse> create(
        @Valid @RequestBody BookingRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(bookingService.createBooking(request, userDetails.getUsername()));
    }

    /** GET /api/bookings/my — current user's bookings */
    @GetMapping("/my")
    public ResponseEntity<PagedResponse<BookingResponse>> getMyBookings(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(bookingService.getMyBookings(userDetails.getUsername(), pageable));
    }

    /** GET /api/bookings/{id} — get one booking (owner or admin) */
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getById(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(bookingService.getBookingById(id, userDetails.getUsername()));
    }

    /** DELETE /api/bookings/{id} — cancel booking (owner or admin) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        bookingService.cancelBooking(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    /** GET /api/bookings — all bookings, optionally filtered by status (ADMIN) */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<BookingResponse>> getAll(
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(bookingService.getAllBookings(status, pageable));
    }

    /** PATCH /api/bookings/{id}/status — approve or reject (ADMIN) */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody BookingStatusRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, request, userDetails.getUsername()));
    }

    /** GET /api/bookings/stats — booking counts by status (ADMIN) */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(bookingService.getBookingStats());
    }
}
