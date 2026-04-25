package com.smartcampus.service;

import com.smartcampus.dto.request.BookingRequest;
import com.smartcampus.dto.request.BookingStatusRequest;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request, String userEmail);

    PagedResponse<BookingResponse> getMyBookings(String userEmail, Pageable pageable);

    PagedResponse<BookingResponse> getAllBookings(String statusFilter, Pageable pageable);

    BookingResponse getBookingById(Long id, String userEmail);

    BookingResponse updateBookingStatus(Long id, BookingStatusRequest request, String adminEmail);

    void cancelBooking(Long id, String userEmail);

    Map<String, Long> getBookingStats();
}
