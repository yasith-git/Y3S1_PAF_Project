import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Box, Container, Grid, Typography, Button, Chip, Paper, Avatar,
  Divider, Stack, Breadcrumbs, CircularProgress, Card, CardContent,
  List, ListItem, ListItemIcon, ListItemText, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Tabs, Tab,
} from '@mui/material'
import SchoolIcon          from '@mui/icons-material/School'
import ScienceIcon         from '@mui/icons-material/Science'
import MeetingRoomIcon     from '@mui/icons-material/MeetingRoom'
import DevicesIcon         from '@mui/icons-material/Devices'
import LocationOnIcon      from '@mui/icons-material/LocationOn'
import PeopleIcon          from '@mui/icons-material/People'
import BusinessIcon        from '@mui/icons-material/Business'
import CheckCircleIcon     from '@mui/icons-material/CheckCircle'
import ScheduleIcon        from '@mui/icons-material/Schedule'
import BookmarkAddIcon     from '@mui/icons-material/BookmarkAdd'
import HomeIcon            from '@mui/icons-material/Home'
import ArrowBackIcon       from '@mui/icons-material/ArrowBack'
import NavigateNextIcon    from '@mui/icons-material/NavigateNext'
import StarIcon            from '@mui/icons-material/Star'
import InfoOutlinedIcon    from '@mui/icons-material/InfoOutlined'
import EditIcon            from '@mui/icons-material/Edit'
import { getResourceById, searchResources } from '../../api/resourceApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  LECTURE_HALL: { label: 'Lecture Hall',  icon: <SchoolIcon />,      color: '#1565C0', gradient: 'linear-gradient(135deg,#0D47A1,#1565C0)', bg: '#E3F2FD' },
  LAB:          { label: 'Lab',           icon: <ScienceIcon />,     color: '#2E7D32', gradient: 'linear-gradient(135deg,#1B5E20,#2E7D32)', bg: '#E8F5E9' },
  MEETING_ROOM: { label: 'Meeting Room',  icon: <MeetingRoomIcon />, color: '#E65100', gradient: 'linear-gradient(135deg,#BF360C,#E65100)', bg: '#FFF3E0' },
  EQUIPMENT:    { label: 'Equipment',     icon: <DevicesIcon />,     color: '#6A1B9A', gradient: 'linear-gradient(135deg,#4A148C,#6A1B9A)', bg: '#F3E5F5' },
}
const STATUS_STYLES = {
  ACTIVE:            { label: 'Active',            bg: '#E8F5E9', color: '#2E7D32', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  OUT_OF_SERVICE:    { label: 'Out of Service',    bg: '#FFEBEE', color: '#C62828', icon: null },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', bg: '#FFF8E1', color: '#F57F17', icon: null },
}

// ─── Info row component ───────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <Box display="flex" alignItems="flex-start" gap={2} py={1.5}
    sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
    <Box sx={{ color: 'text.secondary', mt: 0.2 }}>{icon}</Box>
    <Box flex={1}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500}>{value}</Typography>
    </Box>
  </Box>
)

// ─── Related resource card ────────────────────────────────────────────────────
const RelatedCard = ({ resource, onClick }) => {
  const tc = TYPE_CONFIG[resource.type] || {}
  return (
    <Card sx={{
      cursor: 'pointer', borderRadius: 3, border: '1.5px solid', borderColor: 'divider',
      transition: 'all .2s', '&:hover': { borderColor: tc.color, transform: 'translateY(-3px)', boxShadow: 4 },
    }} onClick={onClick}>
      <Box sx={{ height: 4, bgcolor: tc.color }} />
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" gap={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: tc.bg, color: tc.color }}>{tc.icon}</Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{resource.name}</Typography>
            <Typography variant="caption" color="text.secondary">{resource.location}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ResourceDetailPage = () => {
  const { id }                   = useParams()
  const navigate                 = useNavigate()
  const { isLoggedIn, isAdmin }  = useAuth()

  const [resource, setResource]   = useState(null)
  const [related,  setRelated]    = useState([])
  const [loading,  setLoading]    = useState(true)
  const [tab,      setTab]        = useState(0)
  const [bookDlg,  setBookDlg]    = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getResourceById(id)
        setResource(res.data)
        // load related (same type, exclude self)
        const rel = await searchResources({ type: res.data.type, status: 'ACTIVE', size: 4 })
        setRelated((rel.data.content || []).filter(r => r.id !== Number(id)).slice(0, 3))
      } catch {
        toast.error('Resource not found')
        navigate('/resources')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    )
  }
  if (!resource) return null

  const tc = TYPE_CONFIG[resource.type] || {}
  const ss = STATUS_STYLES[resource.status] || {}
  const features = resource.features ? resource.features.split(',').map(f => f.trim()).filter(Boolean) : []
  const avWindows = resource.availabilityWindows || ''

  const canBook = isLoggedIn && resource.status === 'ACTIVE'

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <Box sx={{ background: tc.gradient || 'linear-gradient(135deg,#1565C0,#0D47A1)', color: 'white', py: 5 }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 2, '& *': { color: 'rgba(255,255,255,.75) !important' } }}>
            <Box display="flex" alignItems="center" gap={0.5} component={Link} to="/" sx={{ textDecoration: 'none' }}>
              <HomeIcon fontSize="small" /><Typography variant="body2">Home</Typography>
            </Box>
            <Box component={Link} to="/resources" sx={{ textDecoration: 'none' }}>
              <Typography variant="body2">Resources</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.9) !important' }}>{resource.name}</Typography>
          </Breadcrumbs>

          <Grid container spacing={4} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.3)' }}>
                <Box sx={{ fontSize: 42, display: 'flex' }}>{tc.icon}</Box>
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h3" fontWeight={800} sx={{ textShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
                {resource.name}
              </Typography>
              <Box display="flex" gap={1.5} mt={1} flexWrap="wrap" alignItems="center">
                <Chip label={tc.label} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,.2)', color: 'white', fontWeight: 600 }} />
                <Chip
                  icon={ss.icon}
                  label={ss.label}
                  size="small"
                  sx={{ bgcolor: ss.bg, color: ss.color, fontWeight: 700 }}
                />
                {resource.capacity && (
                  <Box display="flex" alignItems="center" gap={0.5} sx={{ opacity: .9 }}>
                    <PeopleIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">Capacity: {resource.capacity}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item>
              <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
                {canBook && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<BookmarkAddIcon />}
                    onClick={() => navigate(`/bookings/new?resourceId=${resource.id}`)}
                    sx={{ bgcolor: 'white', color: tc.color, fontWeight: 700, borderRadius: 3,
                          '&:hover': { bgcolor: 'grey.100' } }}
                  >
                    Book Now
                  </Button>
                )}
                {!isLoggedIn && (
                  <Button variant="outlined" size="large"
                    onClick={() => navigate('/login')}
                    sx={{ borderColor: 'white', color: 'white', borderRadius: 3 }}>
                    Sign in to Book
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="outlined" size="large" startIcon={<EditIcon />}
                    onClick={() => navigate('/admin/resources')}
                    sx={{ borderColor: 'rgba(255,255,255,.6)', color: 'white', borderRadius: 3 }}>
                    Edit
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Left column */}
          <Grid item xs={12} md={8}>
            {/* Status warning */}
            {resource.status !== 'ACTIVE' && (
              <Alert severity={resource.status === 'OUT_OF_SERVICE' ? 'error' : 'warning'} sx={{ mb: 3, borderRadius: 3 }}>
                This resource is currently <strong>{ss.label}</strong> and cannot be booked.
              </Alert>
            )}

            {/* Tabs */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Tab label="Overview" />
                <Tab label="Availability" />
                {features.length > 0 && <Tab label={`Features (${features.length})`} />}
              </Tabs>

              <Box p={3}>
                {tab === 0 && (
                  <Box>
                    {resource.description && (
                      <Box mb={3}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>About</Typography>
                        <Typography variant="body1" color="text.secondary" lineHeight={1.8}>
                          {resource.description}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Resource Details</Typography>
                    <InfoRow icon={<LocationOnIcon />} label="Location"  value={resource.location} />
                    {resource.building && <InfoRow icon={<BusinessIcon />} label="Building" value={resource.building} />}
                    {resource.capacity && <InfoRow icon={<PeopleIcon />} label="Capacity"  value={`${resource.capacity} people`} />}
                    <InfoRow icon={tc.icon} label="Type" value={tc.label} />
                  </Box>
                )}

                {tab === 1 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Availability Windows
                    </Typography>
                    {avWindows ? (
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                          {avWindows}
                        </Typography>
                      </Paper>
                    ) : (
                      <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                        <ScheduleIcon />
                        <Typography variant="body2">Contact admin for availability information.</Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {tab === 2 && features.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Features & Equipment</Typography>
                    <Grid container spacing={1}>
                      {features.map(f => (
                        <Grid item key={f}>
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            label={f}
                            sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 500 }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Back button */}
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/resources')}
              sx={{ mt: 3 }}
            >
              Back to Resources
            </Button>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={4}>
            {/* Quick booking card */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Quick Actions</Typography>
              <Stack spacing={1.5}>
                <Button
                  fullWidth variant={canBook ? 'contained' : 'outlined'}
                  startIcon={<BookmarkAddIcon />}
                  disabled={!canBook}
                  onClick={() => navigate(`/bookings/new?resourceId=${resource.id}`)}
                  sx={{ borderRadius: 2, py: 1.2 }}
                >
                  {canBook ? 'Book This Resource' : 'Not Available'}
                </Button>
                <Button fullWidth variant="outlined" component={Link} to="/resources"
                  sx={{ borderRadius: 2 }}>
                  Browse Other Resources
                </Button>
              </Stack>

              {!isLoggedIn && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontSize: 12 }}>
                  <Link to="/login" style={{ fontWeight: 700 }}>Sign in</Link> to book this resource.
                </Alert>
              )}
            </Paper>

            {/* Key info summary */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Summary</Typography>
              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Chip label={tc.label} size="small" sx={{ bgcolor: tc.bg, color: tc.color }} />
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip label={ss.label} size="small" sx={{ bgcolor: ss.bg, color: ss.color, fontWeight: 700 }} />
                </Box>
                {resource.capacity && (
                  <>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Capacity</Typography>
                      <Typography variant="body2" fontWeight={600}>{resource.capacity} people</Typography>
                    </Box>
                  </>
                )}
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="body2" color="text.secondary">Location</Typography>
                  <Typography variant="body2" fontWeight={600} textAlign="right" maxWidth={160}>
                    {resource.location}{resource.building ? `, ${resource.building}` : ''}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Related resources */}
            {related.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Similar Resources</Typography>
                <Stack spacing={1.5}>
                  {related.map(r => (
                    <RelatedCard key={r.id} resource={r} onClick={() => navigate(`/resources/${r.id}`)} />
                  ))}
                </Stack>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default ResourceDetailPage
