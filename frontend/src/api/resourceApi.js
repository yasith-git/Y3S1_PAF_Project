import api from './axiosInstance'

export const searchResources = (params) =>
  api.get('/resources', { params })

export const getResourceById = (id) =>
  api.get(`/resources/${id}`)

export const getResourceTypes = () =>
  api.get('/resources/types')

export const getResourcesByType = (type) =>
  api.get(`/resources/by-type/${type}`)

export const getResourceStats = () =>
  api.get('/resources/stats')

export const createResource = (data) =>
  api.post('/resources', data)

export const updateResource = (id, data) =>
  api.put(`/resources/${id}`, data)

export const updateResourceStatus = (id, status) =>
  api.patch(`/resources/${id}/status`, { status })

export const deleteResource = (id) =>
  api.delete(`/resources/${id}`)
