import axios from './axiosInstance'

export const createTicket  = (formData) =>
  axios.post('/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const getMyTickets  = () => axios.get('/tickets/my')

export const getTicketById = (id) => axios.get(`/tickets/${id}`)

export const getComments   = (id) => axios.get(`/tickets/${id}/comments`)

export const addComment    = (id, data) => axios.post(`/tickets/${id}/comments`, data)

export const getAllTickets  = (params) => axios.get('/tickets', { params })

export const updateTicketStatus = (id, data) => axios.patch(`/tickets/${id}/status`, data)

export const deleteTicket  = (id) => axios.delete(`/tickets/${id}`)

export const getTicketStats = () => axios.get('/tickets/stats')
