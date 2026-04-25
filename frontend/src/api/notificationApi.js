import api from './axiosInstance'

export const getMyNotifications = () =>
  api.get('/notifications')

export const getUnreadCount = () =>
  api.get('/notifications/unread-count')

export const markAsRead = (id) =>
  api.put(`/notifications/${id}/read`)

export const markAllAsRead = () =>
  api.put('/notifications/read-all')

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`)
