import api from './axiosInstance'

export const loginWithGoogle = (idToken) =>
  api.post('/auth/google', { idToken })

export const getCurrentUser = () =>
  api.get('/auth/me')

export const getAllUsers = () =>
  api.get('/users')

export const updateUserRole = (userId, role) =>
  api.patch(`/users/${userId}/role`, { role })
