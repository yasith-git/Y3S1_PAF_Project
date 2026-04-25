import axios from './axiosInstance'

export const createBooking       = (data)         => axios.post('/bookings', data)
export const getMyBookings       = (params)        => axios.get('/bookings/my', { params })
export const getBookingById      = (id)            => axios.get(`/bookings/${id}`)
export const cancelBooking       = (id)            => axios.delete(`/bookings/${id}`)

// Admin
export const getAllBookings      = (params)        => axios.get('/bookings', { params })
export const updateBookingStatus = (id, data)      => axios.patch(`/bookings/${id}/status`, data)
export const getBookingStats     = ()              => axios.get('/bookings/stats')
