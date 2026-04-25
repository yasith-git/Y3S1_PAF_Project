import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Container, Typography, Button, Chip, Paper, Avatar,
  Grid, Stack, Divider, CircularProgress, Pagination, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab,
  Card, CardContent, Breadcrumbs, Tooltip, Fade, Skeleton,
} from '@mui/material'
import HomeIcon          from '@mui/icons-material/Home'
import NavigateNextIcon  from '@mui/icons-material/NavigateNext'
import AddIcon           from '@mui/icons-material/Add'
import CancelIcon        from '@mui/icons-material/Cancel'
import SchoolIcon        from '@mui/icons-material/School'
import ScienceIcon       from '@mui/icons-material/Science'
import MeetingRoomIcon   from '@mui/icons-material/MeetingRoom'
import DevicesIcon       from '@mui/icons-material/Devices'
import AccessTimeIcon    from '@mui/icons-material/AccessTime'
import LocationOnIcon    from '@mui/icons-material/LocationOn'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import BlockIcon         from '@mui/icons-material/Block'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import { getMyBookings, cancelBooking } from '../../api/bookingApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  LECTURE_HALL: { label: 'Lecture Hall',  icon: <SchoolIcon />,      color: '#1565C0', bg: '#E3F2FD' },
  LAB:          { label: 'Lab',           icon: <ScienceIcon />,     color: '#2E7D32', bg: '#E8F5E9' },
  MEETING_ROOM: { label: 'Meeting Room',  icon: <MeetingRoomIcon />, color: '#E65100', bg: '#FFF3E0' },
  EQUIPMENT:    { label: 'Equipment',     icon: <DevicesIcon />,     color: '#6A1B9A', bg: '#F3E5F5' },
}
const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   bg: '#FFF8E1', color: '#F57F17', icon: <PendingActionsIcon sx={{ fontSize: 14 }} /> },
  APPROVED:  { label: 'Approved',  bg: '#E8F5E9', color: '#2E7D32', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  REJECTED:  { label: 'Rejected',  bg: '#FFEBEE', color: '#C62828', icon: <BlockIcon sx={{ fontSize: 14 }} /> },
  CANCELLED: { label: 'Cancelled', bg: '#F5F5F5', color: '#757575', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
}

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

// ─── Booking card ─────────────────────────────────────────────────────────────
const BookingCard = ({ booking, onCancel }) => {
  const tc = TYPE_CONFIG[booking.resourceType]  || {}
  const sc = STATUS_CONFIG[booking.status]      || {}
  const canCancel = ['PENDING', 'APPROVED'].includes(booking.status)
  const start = new Date(booking.startTime)
  const end   = new Date(booking.endTime)

  return (
    <Card sx={{
      borderRadius: 3, border: '1.5px solid', borderColor: 'divider',
      transition: 'all .2s', '&:hover': { boxShadow: 4 },
    }}>
      <Box sx={{ height: 4, bgcolor: tc.color }} />
      <CardContent sx={{ p: 2.5 }}>
        <Grid container spacing={2} alignItems="flex-start">
          {/* Left icon */}
          <Grid item>
            <Avatar sx={{ width: 48, height: 48, bgcolor: tc.bg, color: tc.color }}>{tc.icon}</Avatar>
          </Grid>

          {/* Main info */}
          <Grid item xs>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>{booking.resourceName}</Typography>
              <Chip
                icon={sc.icon}
                label={sc.label}
                size="small"
                sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700 }}
              />
            </Box>

            <Stack spacing={0.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}
                  {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{booking.resourceLocation}</Typography>
              </Box>
              {booking.purpose && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  "{booking.purpose}"
                </Typography>
              )}
              {booking.adminNote && (
                <Alert severity={booking.status === 'APPROVED' ? 'success' : 'error'} sx={{ mt: 0.5, py: 0, borderRadius: 1, fontSize: 12 }}>
                  Admin note: {booking.adminNote}
                </Alert>
              )}
            </Stack>
          </Grid>

          {/* Actions */}
          <Grid item>
            <Stack spacing={1} alignItems="flex-end">
              <Typography variant="caption" color="text.secondary">
                #{booking.id}
              </Typography>
              {canCancel && (
                <Tooltip title="Cancel booking">
                  <Button variant="outlined" color="error" size="small"
                    onClick={() => onCancel(booking)}
                    startIcon={<CancelIcon />}
                    sx={{ borderRadius: 2 }}>
                    Cancel
                  </Button>
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyBookingsPage = () => {
  const navigate       = useNavigate()
  const { user }       = useAuth()

  const [bookings,   setBookings]   = useState([])
  const [loading,    setLoading]    = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [page,       setPage]       = useState(0)
  const [tab,        setTab]        = useState(0)  // index into STATUS_TABS

  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling,   setCancelling]   = useState(false)

  const loadBookings = async (p = page, t = tab) => {
    setLoading(true)
    try {
      const params = { page: p, size: 10 }
      // STATUS_TABS[0] = ALL → no filter
      const res = await getMyBookings(params)
      const all = res.data.content || []
      // client-side filter by tab (server already supports status param, but we keep it simple)
      const filtered = t === 0 ? all : all.filter(b => b.status === STATUS_TABS[t])
      setBookings(filtered)
      setTotalPages(res.data.totalPages || 1)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBookings(0, tab) }, [tab]) // eslint-disable-line

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelBooking(cancelTarget.id)
      toast.success('Booking cancelled')
      setCancelTarget(null)
      loadBookings()
    } catch {
      toast.error('Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? bookings.length : bookings.filter(b => b.status === s).length
    return acc
  }, {})

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg,#1565C0,#0D47A1)',
        color: 'white', py: 4,
      }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 2, '& *': { color: 'rgba(255,255,255,.75) !important' } }}>
            <Box display="flex" alignItems="center" gap={0.5} component={Link} to="/" sx={{ textDecoration: 'none' }}>
              <HomeIcon fontSize="small" /><Typography variant="body2">Home</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.9) !important' }}>My Bookings</Typography>
          </Breadcrumbs>

          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={800}>My Bookings</Typography>
              <Typography variant="body2" sx={{ opacity: .85 }}>
                Welcome back, {user?.name?.split(' ')[0]}
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => navigate('/bookings/new')}
              sx={{ bgcolor: 'white', color: '#1565C0', fontWeight: 700, borderRadius: 2,
                    '&:hover': { bgcolor: '#E3F2FD' } }}>
              New Booking
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Quick stats */}
        <Grid container spacing={2} mb={4}>
          {[
            { label: 'Total', value: bookings.length, color: '#1565C0', bg: '#E3F2FD' },
            { label: 'Pending',   value: bookings.filter(b => b.status === 'PENDING').length,   color: '#F57F17', bg: '#FFF8E1' },
            { label: 'Approved',  value: bookings.filter(b => b.status === 'APPROVED').length,  color: '#2E7D32', bg: '#E8F5E9' },
            { label: 'Rejected',  value: bookings.filter(b => b.status === 'REJECTED').length,  color: '#C62828', bg: '#FFEBEE' },
          ].map(s => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Paper elevation={0} sx={{
                p: 2, borderRadius: 3, textAlign: 'center',
                border: '1px solid', borderColor: 'divider',
              }}>
                <Typography variant="h4" fontWeight={800} color={s.color}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{s.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0) }}
            variant="scrollable" scrollButtons="auto"
            sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
            {STATUS_TABS.map((s, i) => (
              <Tab key={s} label={s === 'ALL' ? 'All Bookings' : s.charAt(0) + s.slice(1).toLowerCase()} />
            ))}
          </Tabs>

          <Box p={3}>
            {loading ? (
              <Stack spacing={2}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} sx={{ borderRadius: 3 }}>
                    <CardContent><Skeleton height={80} /></CardContent>
                  </Card>
                ))}
              </Stack>
            ) : bookings.length === 0 ? (
              <Box textAlign="center" py={6}>
                <EventAvailableIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>No bookings yet</Typography>
                <Typography color="text.secondary" mb={3}>Start by booking a resource for your needs.</Typography>
                <Button variant="contained" startIcon={<AddIcon />}
                  onClick={() => navigate('/bookings/new')}>
                  Make a Booking
                </Button>
              </Box>
            ) : (
              <Fade in>
                <Stack spacing={2}>
                  {bookings.map(b => (
                    <BookingCard key={b.id} booking={b} onCancel={setCancelTarget} />
                  ))}
                </Stack>
              </Fade>
            )}

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination count={totalPages} page={page + 1}
                  onChange={(_, p) => { setPage(p - 1); loadBookings(p - 1, tab) }}
                  color="primary" />
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      {/* ── Cancel confirmation dialog ────────────────────────────────────── */}
      <Dialog open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Cancel Booking?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Cancel your booking for <strong>{cancelTarget?.resourceName}</strong> on{' '}
            {cancelTarget && new Date(cancelTarget.startTime).toLocaleDateString()}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCancelTarget(null)} variant="outlined" sx={{ borderRadius: 2 }}>Keep it</Button>
          <Button onClick={handleCancel} variant="contained" color="error" disabled={cancelling}
            sx={{ borderRadius: 2 }}>
            {cancelling ? <CircularProgress size={18} /> : 'Yes, cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MyBookingsPage
