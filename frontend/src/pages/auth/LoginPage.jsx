import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import {
  Box, Card, CardContent, Typography, Divider, CircularProgress,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const { handleGoogleLogin, isLoggedIn, loading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/'

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isLoggedIn) {
      navigate(from, { replace: true })
    }
  }, [isLoggedIn, loading, navigate, from])

  const onSuccess = async (credentialResponse) => {
    try {
      await handleGoogleLogin(credentialResponse.credential)
      toast.success('Login successful! Welcome to Smart Campus Hub.')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(msg)
    }
  }

  const onError = () => {
    toast.error('Google sign-in was cancelled or failed.')
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={12}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="calc(100vh - 64px)"
      bgcolor="grey.50"
    >
      <Card sx={{ width: 400, borderRadius: 3, boxShadow: 4 }}>
        <CardContent sx={{ p: 5 }}>
          {/* Logo */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
            <SchoolIcon color="primary" sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="h5" fontWeight={700} color="primary">
              Smart Campus Hub
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5} textAlign="center">
              Unified platform for facility bookings &amp; incident management
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Sign in to continue
            </Typography>
          </Divider>

          {/* Google Sign-In Button */}
          <Box display="flex" justifyContent="center">
            <GoogleLogin
              onSuccess={onSuccess}
              onError={onError}
              useOneTap
              shape="rectangular"
              theme="outline"
              size="large"
              text="signin_with"
              locale="en"
            />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            textAlign="center"
            mt={3}
          >
            By signing in you agree to the university's terms of use.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage
