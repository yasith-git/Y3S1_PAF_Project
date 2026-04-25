import { useState, useEffect, useCallback } from 'react'
import {
  Box, Container, Typography, Button, Chip, Paper, Avatar,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
  CircularProgress, InputAdornment, Pagination, Stack, Alert, Card,
  CardContent, Skeleton,
} from '@mui/material'
import SearchIcon       from '@mui/icons-material/Search'
import ClearIcon        from '@mui/icons-material/Clear'
import CheckCircleIcon  from '@mui/icons-material/CheckCircle'
import CancelIcon       from '@mui/icons-material/Cancel'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import BlockIcon        from '@mui/icons-material/Block'
import RefreshIcon      from '@mui/icons-material/Refresh'
import SchoolIcon       from '@mui/icons-material/School'
import ScienceIcon      from '@mui/icons-material/Science'
import MeetingRoomIcon  from '@mui/icons-material/MeetingRoom'
import DevicesIcon      from '@mui/icons-material/Devices'
import DashboardIcon    from '@mui/icons-material/Dashboard'
import PersonIcon       from '@mui/icons-material/Person'
import AccessTimeIcon   from '@mui/icons-material/AccessTime'
import { getAllBookings, updateBookingStatus, cancelBooking, getBookingStats } from '../../api/bookingApi'
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

// ─── Stats card ───────────────────────────────────────────────────────────────
const StatsCard = ({ label, value, icon, color, bg }) => (
  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
      <Avatar sx={{ bgcolor: bg, color, width: 52, height: 52 }}>{icon}</Avatar>
      <Box>
        <Typography variant="h4" fontWeight={800} color={color}>{value ?? '—'}</Typography>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
      </Box>
    </CardContent>
  </Card>
)

// ─── Review dialog ────────────────────────────────────────────────────────────
const ReviewDialog = ({ open, booking, onClose, onConfirm, action }) => {
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => { if (open) setNote('') }, [open])

  const handleConfirm = async () => {
    setSaving(true)
    await onConfirm(action, note)
    setSaving(false)
  }

  if (!booking) return null
  const isApprove = action === 'APPROVED'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        {isApprove ? '✅ Approve Booking' : '❌ Reject Booking'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity={isApprove ? 'success' : 'error'} sx={{ mb: 2.5, borderRadius: 2 }}>
          {isApprove
            ? `Approving booking #${booking.id} for ${booking.userName}`
            : `Rejecting booking #${booking.id} for ${booking.userName}`
          }
        </Alert>
        <Typography variant="body2" color="text.secondary" mb={2}>
          <strong>Resource:</strong> {booking.resourceName} · {booking.resourceLocation}<br />
          <strong>Time:</strong> {new Date(booking.startTime).toLocaleString()} – {new Date(booking.endTime).toLocaleString()}
        </Typography>
        <TextField
          fullWidth multiline rows={2}
          label={isApprove ? 'Note to user (optional)' : 'Reason for rejection (optional)'}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={isApprove ? 'E.g. Please ensure the room is cleaned after use' : 'E.g. Resource unavailable, conflict with scheduled maintenance'}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained"
          color={isApprove ? 'success' : 'error'} disabled={saving}
          sx={{ borderRadius: 2, minWidth: 120 }}>
          {saving ? <CircularProgress size={18} /> : isApprove ? 'Approve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminBookingsPage = () => {
  const [bookings,   setBookings]   = useState([])
  const [stats,      setStats]      = useState({})
  const [loading,    setLoading]    = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [page,       setPage]       = useState(0)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [search,     setSearch]     = useState('')

  const [reviewDlg,  setReviewDlg]  = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewAction, setReviewAction] = useState(null)

  const loadBookings = useCallback(async (p = page, sf = statusFilter) => {
    setLoading(true)
    try {
      const params = { page: p, size: 15 }
      if (sf) params.status = sf
      if (search) params.keyword = search
      const res = await getAllBookings(params)
      setBookings(res.data.content || [])
      setTotalPages(res.data.totalPages || 1)
      setTotalItems(res.data.totalElements || 0)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  const loadStats = useCallback(async () => {
    try {
      const res = await getBookingStats()
      setStats(res.data || {})
    } catch {}
  }, [])

  useEffect(() => { loadBookings(); loadStats() }, [page, statusFilter]) // eslint-disable-line

  const openReview = (booking, action) => {
    setReviewTarget(booking)
    setReviewAction(action)
    setReviewDlg(true)
  }

  const handleReviewConfirm = async (status, adminNote) => {
    try {
      await updateBookingStatus(reviewTarget.id, { status, adminNote: adminNote || null })
      toast.success(`Booking ${status.toLowerCase()}`)
      setReviewDlg(false)
      setReviewTarget(null)
      loadBookings(); loadStats()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed')
    }
  }

  const handleCancel = async (booking) => {
    try {
      await cancelBooking(booking.id)
      toast.success('Booking cancelled')
      loadBookings(); loadStats()
    } catch { toast.error('Cancel failed') }
  }

  const total = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 3 }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main' }}><DashboardIcon /></Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800}>Booking Management</Typography>
                <Typography variant="body2" color="text.secondary">Admin · Review and manage all bookings</Typography>
              </Box>
            </Box>
            <Tooltip title="Refresh">
              <IconButton onClick={() => { loadBookings(); loadStats() }}><RefreshIcon /></IconButton>
            </Tooltip>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Stats */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatsCard label="Total Bookings" value={total} icon={<DashboardIcon />} color="#1565C0" bg="#E3F2FD" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatsCard label="Pending Review" value={stats.PENDING} icon={<PendingActionsIcon />} color="#F57F17" bg="#FFF8E1" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatsCard label="Approved" value={stats.APPROVED} icon={<CheckCircleIcon />} color="#2E7D32" bg="#E8F5E9" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatsCard label="Rejected" value={stats.REJECTED} icon={<BlockIcon />} color="#C62828" bg="#FFEBEE" />
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField fullWidth size="small" placeholder="Search by resource, user…"
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadBookings(0, statusFilter)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}><ClearIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { borderRadius: 2 },
                }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status"
                  onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
                  <MenuItem value="">All</MenuItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <MenuItem key={k} value={k}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ color: v.color }}>{v.icon}</Box>{v.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">{totalItems} booking{totalItems !== 1 ? 's' : ''}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Resource</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Time Slot</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : bookings.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No bookings found</Typography>
                        </TableCell>
                      </TableRow>
                    )
                    : bookings.map(b => {
                        const tc = TYPE_CONFIG[b.resourceType] || {}
                        const sc = STATUS_CONFIG[b.status]     || {}
                        return (
                          <TableRow key={b.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">#{b.id}</Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: tc.bg, color: tc.color }}>{tc.icon}</Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>{b.resourceName}</Typography>
                                  <Typography variant="caption" color="text.secondary">{b.resourceLocation}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>{b.userName}</Typography>
                                  <Typography variant="caption" color="text.secondary">{b.userEmail}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {new Date(b.startTime).toLocaleDateString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {' – '}
                                  {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" noWrap maxWidth={150}>
                                {b.purpose || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip icon={sc.icon} label={sc.label} size="small"
                                sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700 }} />
                            </TableCell>
                            <TableCell align="right">
                              {b.status === 'PENDING' && (
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                  <Tooltip title="Approve">
                                    <IconButton size="small" color="success"
                                      onClick={() => openReview(b, 'APPROVED')}>
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton size="small" color="error"
                                      onClick={() => openReview(b, 'REJECTED')}>
                                      <BlockIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              )}
                              {['PENDING', 'APPROVED'].includes(b.status) && (
                                <Tooltip title="Cancel">
                                  <IconButton size="small" onClick={() => handleCancel(b)}>
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                }
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" p={2} borderTop="1px solid" borderColor="divider">
              <Pagination count={totalPages} page={page + 1}
                onChange={(_, p) => setPage(p - 1)} color="primary" />
            </Box>
          )}
        </Paper>
      </Container>

      <ReviewDialog
        open={reviewDlg}
        booking={reviewTarget}
        action={reviewAction}
        onClose={() => { setReviewDlg(false); setReviewTarget(null) }}
        onConfirm={handleReviewConfirm}
      />
    </Box>
  )
}

export default AdminBookingsPage
