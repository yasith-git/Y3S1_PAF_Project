import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, CardMedia, CardActionArea,
  Typography, TextField, MenuItem, Select, FormControl,
  InputLabel, Button, Chip, Pagination, CircularProgress,
  InputAdornment, IconButton, Tooltip, Divider,
} from '@mui/material'
import SearchIcon    from '@mui/icons-material/Search'
import ClearIcon     from '@mui/icons-material/Clear'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import ScienceIcon   from '@mui/icons-material/Science'
import VideocamIcon  from '@mui/icons-material/Videocam'
import SchoolIcon    from '@mui/icons-material/School'
import { searchResources } from '../../api/resourceApi'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = [
  { value: '',              label: 'All Types' },
  { value: 'LECTURE_HALL',  label: 'Lecture Hall' },
  { value: 'LAB',           label: 'Lab' },
  { value: 'MEETING_ROOM',  label: 'Meeting Room' },
  { value: 'EQUIPMENT',     label: 'Equipment' },
]

const STATUS_OPTIONS = [
  { value: '',                 label: 'All Statuses' },
  { value: 'ACTIVE',           label: 'Active' },
  { value: 'OUT_OF_SERVICE',   label: 'Out of Service' },
  { value: 'UNDER_MAINTENANCE',label: 'Under Maintenance' },
]

const STATUS_COLOR = {
  ACTIVE:            'success',
  OUT_OF_SERVICE:    'error',
  UNDER_MAINTENANCE: 'warning',
}

const TYPE_ICON = {
  LECTURE_HALL: <SchoolIcon />,
  LAB:          <ScienceIcon />,
  MEETING_ROOM: <MeetingRoomIcon />,
  EQUIPMENT:    <VideocamIcon />,
}

const ResourceListPage = () => {
  const navigate = useNavigate()

  const [resources,   setResources]   = useState([])
  const [loading,     setLoading]     = useState(false)
  const [totalPages,  setTotalPages]  = useState(1)
  const [totalItems,  setTotalItems]  = useState(0)

  const [filters, setFilters] = useState({
    keyword: '', type: '', status: 'ACTIVE',
    location: '', minCapacity: '', page: 0, size: 12,
  })

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.keyword)     params.keyword     = filters.keyword
      if (filters.type)        params.type        = filters.type
      if (filters.status)      params.status      = filters.status
      if (filters.location)    params.location    = filters.location
      if (filters.minCapacity) params.minCapacity = filters.minCapacity
      params.page = filters.page
      params.size = filters.size

      const res = await searchResources(params)
      setResources(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalItems(res.data.totalElements)
    } catch {
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchResources() }, [fetchResources])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }))
  }

  const handleClearFilters = () => {
    setFilters({ keyword: '', type: '', status: 'ACTIVE', location: '', minCapacity: '', page: 0, size: 12 })
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Page Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} color="primary">
          Facilities & Assets
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse and search all bookable campus resources
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small" placeholder="Search by name, description, features…"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
                ),
                endAdornment: filters.keyword && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleFilterChange('keyword', '')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={filters.type} label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}>
                {TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filters.status} label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField fullWidth size="small" label="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)} />
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField fullWidth size="small" label="Min Cap." type="number"
              value={filters.minCapacity}
              onChange={(e) => handleFilterChange('minCapacity', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={1}>
            <Tooltip title="Clear filters">
              <Button variant="outlined" size="small" fullWidth onClick={handleClearFilters}>
                Clear
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Card>

      {/* Results count */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading…' : `${totalItems} resource${totalItems !== 1 ? 's' : ''} found`}
        </Typography>
      </Box>

      {/* Resource Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : resources.length === 0 ? (
        <Box textAlign="center" mt={8}>
          <Typography variant="h6" color="text.secondary">No resources found</Typography>
          <Button sx={{ mt: 2 }} onClick={handleClearFilters}>Clear filters</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {resources.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column',
                          transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardActionArea onClick={() => navigate(`/resources/${r.id}`)} sx={{ flex: 1 }}>
                  {r.imageUrl ? (
                    <CardMedia component="img" height="160" image={r.imageUrl} alt={r.name} />
                  ) : (
                    <Box height={160} display="flex" alignItems="center" justifyContent="center"
                         bgcolor="primary.50" color="primary.main" fontSize={64}>
                      {TYPE_ICON[r.type]}
                    </Box>
                  )}
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" fontWeight={600} noWrap sx={{ flex: 1 }}>
                        {r.name}
                      </Typography>
                      <Chip
                        label={r.status.replace(/_/g, ' ')}
                        color={STATUS_COLOR[r.status]}
                        size="small"
                        sx={{ ml: 1, flexShrink: 0 }}
                      />
                    </Box>

                    <Chip
                      icon={TYPE_ICON[r.type]}
                      label={r.type.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />

                    <Typography variant="body2" color="text.secondary">
                      📍 {r.location}{r.building ? ` · ${r.building}` : ''}
                    </Typography>
                    {r.capacity && (
                      <Typography variant="body2" color="text.secondary">
                        👥 Capacity: {r.capacity}
                      </Typography>
                    )}
                    {r.description && (
                      <Typography variant="body2" color="text.secondary"
                        sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {r.description}
                      </Typography>
                    )}
                    {r.features && (
                      <Box mt={1} display="flex" flexWrap="wrap" gap={0.5}>
                        {r.features.split(',').slice(0, 3).map((f) => (
                          <Chip key={f} label={f.trim()} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={filters.page + 1}
            onChange={(_, v) => setFilters((p) => ({ ...p, page: v - 1 }))}
            color="primary"
          />
        </Box>
      )}
    </Box>
  )
}

export default ResourceListPage
