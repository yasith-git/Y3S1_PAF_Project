import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Chip, Button, Grid, Card, CardContent,
  Divider, CircularProgress, Alert,
} from '@mui/material'
import ArrowBackIcon   from '@mui/icons-material/ArrowBack'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import { getResourceById } from '../../api/resourceApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  ACTIVE:            'success',
  OUT_OF_SERVICE:    'error',
  UNDER_MAINTENANCE: 'warning',
}

const ResourceDetailPage = () => {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [resource, setResource] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getResourceById(id)
      .then((res) => setResource(res.data))
      .catch(() => toast.error('Resource not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
  if (!resource) return <Alert severity="error" sx={{ m: 4 }}>Resource not found.</Alert>

  const canBook = resource.status === 'ACTIVE'

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to Resources
      </Button>

      <Card elevation={3}>
        {resource.imageUrl && (
          <Box
            component="img"
            src={resource.imageUrl}
            alt={resource.name}
            sx={{ width: '100%', maxHeight: 350, objectFit: 'cover' }}
          />
        )}

        <CardContent sx={{ p: 4 }}>
          {/* Title & Status */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h4" fontWeight={700}>{resource.name}</Typography>
            <Chip
              label={resource.status.replace(/_/g, ' ')}
              color={STATUS_COLOR[resource.status]}
              size="medium"
            />
          </Box>

          <Chip
            label={resource.type.replace(/_/g, ' ')}
            variant="outlined"
            color="primary"
            sx={{ mb: 3 }}
          />

          <Divider sx={{ mb: 3 }} />

          {/* Details Grid */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Location</Typography>
              <Typography variant="body1">
                {resource.location}{resource.building ? ` — ${resource.building}` : ''}
              </Typography>
            </Grid>

            {resource.capacity && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Capacity</Typography>
                <Typography variant="body1">{resource.capacity} seats</Typography>
              </Grid>
            )}

            {resource.availabilityWindows && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Availability</Typography>
                <Typography variant="body1">{resource.availabilityWindows}</Typography>
              </Grid>
            )}
          </Grid>

          {/* Description */}
          {resource.description && (
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">{resource.description}</Typography>
            </Box>
          )}

          {/* Features */}
          {resource.features && (
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Features
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {resource.features.split(',').map((f) => (
                  <Chip key={f} label={f.trim()} size="small" />
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Book Button */}
          {canBook ? (
            isLoggedIn ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<BookmarkAddIcon />}
                onClick={() => navigate('/bookings/new', { state: { resourceId: resource.id, resourceName: resource.name } })}
              >
                Book This Resource
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login', { state: { from: { pathname: `/resources/${id}` } } })}
              >
                Login to Book
              </Button>
            )
          ) : (
            <Alert severity="warning">
              This resource is currently {resource.status.replace(/_/g, ' ').toLowerCase()} and cannot be booked.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default ResourceDetailPage
