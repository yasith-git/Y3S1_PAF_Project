import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { CircularProgress, Box, Typography } from '@mui/material'

const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />

  if (!isAdmin) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <Typography variant="h6" color="error">
          403 – Access Denied. Admin only.
        </Typography>
      </Box>
    )
  }

  return children
}

export default AdminRoute
