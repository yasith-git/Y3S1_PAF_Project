import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Box, Container, Grid, Typography, Button, Paper, TextField,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress,
  Card, CardContent, Chip, Avatar, Divider, Breadcrumbs, Stack,
  InputAdornment, Stepper, Step, StepLabel,
} from '@mui/material'
import HomeIcon            from '@mui/icons-material/Home'
import NavigateNextIcon    from '@mui/icons-material/NavigateNext'
import SchoolIcon          from '@mui/icons-material/School'
import ScienceIcon         from '@mui/icons-material/Science'
import MeetingRoomIcon     from '@mui/icons-material/MeetingRoom'
import DevicesIcon         from '@mui/icons-material/Devices'
import LocationOnIcon      from '@mui/icons-material/LocationOn'
import PeopleIcon          from '@mui/icons-material/People'
import AccessTimeIcon      from '@mui/icons-material/AccessTime'
import EventAvailableIcon  from '@mui/icons-material/EventAvailable'
import CheckCircleIcon     from '@mui/icons-material/CheckCircle'
import { createBooking } from '../../api/bookingApi'
import { searchResources, getResourceById } from '../../api/resourceApi'
import toast from 'react-hot-toast'

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  LECTURE_HALL: { label: 'Lecture Hall',  icon: <SchoolIcon />,      color: '#1565C0', bg: '#E3F2FD' },
  LAB:          { label: 'Lab',           icon: <ScienceIcon />,     color: '#2E7D32', bg: '#E8F5E9' },
  MEETING_ROOM: { label: 'Meeting Room',  icon: <MeetingRoomIcon />, color: '#E65100', bg: '#FFF3E0' },
  EQUIPMENT:    { label: 'Equipment',     icon: <DevicesIcon />,     color: '#6A1B9A', bg: '#F3E5F5' },
}

const STEPS = ['Select Resource', 'Choose Time Slot', 'Confirm & Submit']

// ─── Resource selector card ───────────────────────────────────────────────────
const ResourceCard = ({ resource, selected, onClick }) => {
  const tc = TYPE_CONFIG[resource.type] || {}
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer', borderRadius: 3, border: '2px solid',
        borderColor: selected ? tc.color : 'divider',
        bgcolor: selected ? tc.bg : 'white',
        transition: 'all .2s',
        '&:hover': { borderColor: tc.color, transform: 'translateY(-3px)', boxShadow: 4 },
      }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: tc.bg, color: tc.color, width: 40, height: 40 }}>{tc.icon}</Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{resource.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {resource.location}{resource.capacity ? ` · Cap: ${resource.capacity}` : ''}
            </Typography>
          </Box>
          {selected && <CheckCircleIcon sx={{ color: tc.color, flexShrink: 0 }} />}
        </Box>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const BookingFormPage = () => {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  const [step,     setStep]     = useState(0)
  const [resource, setResource] = useState(null)
  const [resources, setResources] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [loadingResources, setLoadingResources] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)

  const [form, setForm] = useState({
    resourceId: '',
    startTime:  '',
    endTime:    '',
    purpose:    '',
  })

  // Pre-select resource from query param
  useEffect(() => {
    const rid = searchParams.get('resourceId')
    if (rid) {
      getResourceById(rid).then(r => {
        setResource(r.data)
        setForm(prev => ({ ...prev, resourceId: r.data.id }))
        setStep(1)
      }).catch(() => {})
    }
  }, [searchParams])

  // Load resources list
  useEffect(() => {
    setLoadingResources(true)
    const params = { status: 'ACTIVE', size: 50 }
    if (typeFilter) params.type = typeFilter
    searchResources(params)
      .then(r => setResources(r.data.content || []))
      .catch(() => {})
      .finally(() => setLoadingResources(false))
  }, [typeFilter])

  const selectResource = (r) => {
    setResource(r)
    setForm(prev => ({ ...prev, resourceId: r.id }))
  }

  const handleNext = () => {
    if (step === 0 && !form.resourceId) { toast.error('Please select a resource'); return }
    if (step === 1) {
      if (!form.startTime) { toast.error('Start time is required'); return }
      if (!form.endTime)   { toast.error('End time is required');   return }
      if (form.endTime <= form.startTime) { toast.error('End time must be after start time'); return }
      const start = new Date(form.startTime)
      if (start < new Date()) { toast.error('Start time must be in the future'); return }
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await createBooking({
        resourceId: form.resourceId,
        startTime:  form.startTime,
        endTime:    form.endTime,
        purpose:    form.purpose || null,
      })
      setSuccess(true)
      toast.success('Booking submitted for review!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const tc = resource ? (TYPE_CONFIG[resource.type] || {}) : {}

  if (success) {
    return (
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: '#E8F5E9', color: '#2E7D32', mx: 'auto', mb: 2 }}>
              <EventAvailableIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" fontWeight={800} gutterBottom>Booking Submitted!</Typography>
            <Typography color="text.secondary" mb={3}>
              Your booking for <strong>{resource?.name}</strong> is under review. You'll be notified once it's approved.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" onClick={() => navigate('/bookings/my')} sx={{ borderRadius: 2 }}>
                View My Bookings
              </Button>
              <Button variant="outlined" onClick={() => navigate('/resources')} sx={{ borderRadius: 2 }}>
                Browse More
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 2.5, px: 3 }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
            <Box display="flex" alignItems="center" gap={0.5} component={Link} to="/"
              sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
              <HomeIcon fontSize="small" /><Typography variant="body2">Home</Typography>
            </Box>
            <Box component={Link} to="/resources" sx={{ color: 'text.secondary', textDecoration: 'none' }}>
              <Typography variant="body2">Resources</Typography>
            </Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">New Booking</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight={800} color="primary">New Booking</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* ── Stepper ─────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
          <Stepper activeStep={step}>
            {STEPS.map(label => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        </Paper>

        <Grid container spacing={4}>
          {/* ── Left main area ──────────────────────────────────────────── */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>

              {/* STEP 0 — Select resource */}
              {step === 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>Select a Resource</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Choose the facility or equipment you want to book.
                  </Typography>

                  {/* Type filter */}
                  <FormControl size="small" sx={{ mb: 2.5, minWidth: 200 }}>
                    <InputLabel>Filter by Type</InputLabel>
                    <Select value={typeFilter} label="Filter by Type"
                      onChange={e => setTypeFilter(e.target.value)}>
                      <MenuItem value="">All Types</MenuItem>
                      {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                        <MenuItem key={k} value={k}>{v.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {loadingResources ? (
                    <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                  ) : (
                    <Grid container spacing={2}>
                      {resources.map(r => (
                        <Grid item xs={12} sm={6} key={r.id}>
                          <ResourceCard
                            resource={r}
                            selected={form.resourceId === r.id}
                            onClick={() => selectResource(r)}
                          />
                        </Grid>
                      ))}
                      {resources.length === 0 && (
                        <Grid item xs={12}>
                          <Typography color="text.secondary" textAlign="center" py={4}>
                            No active resources found
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </Box>
              )}

              {/* STEP 1 — Choose time slot */}
              {step === 1 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>Choose Time Slot</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Select your desired start and end date/time.
                  </Typography>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth label="Start Date & Time" type="datetime-local"
                        value={form.startTime}
                        onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon color="action" /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth label="End Date & Time" type="datetime-local"
                        value={form.endTime}
                        onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon color="action" /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth multiline rows={3}
                        label="Purpose / Description (optional)"
                        value={form.purpose}
                        onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                        placeholder="E.g. CS3202 Lab session, Team meeting…"
                      />
                    </Grid>
                  </Grid>

                  {form.startTime && form.endTime && form.endTime > form.startTime && (
                    <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2 }}>
                      Duration: {Math.round((new Date(form.endTime) - new Date(form.startTime)) / 60000)} minutes
                    </Alert>
                  )}
                </Box>
              )}

              {/* STEP 2 — Confirm */}
              {step === 2 && resource && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>Confirm Your Booking</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Please review the details before submitting.
                  </Typography>

                  <Box sx={{ p: 3, bgcolor: tc.bg || 'grey.50', borderRadius: 3, mb: 3 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'white', color: tc.color, width: 52, height: 52 }}>{tc.icon}</Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>{resource.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{resource.location}</Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Start</Typography>
                        <Typography variant="body2" fontWeight={600}>{new Date(form.startTime).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">End</Typography>
                        <Typography variant="body2" fontWeight={600}>{new Date(form.endTime).toLocaleString()}</Typography>
                      </Grid>
                      {form.purpose && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Purpose</Typography>
                          <Typography variant="body2">{form.purpose}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Your booking will be reviewed by an admin. You'll receive a notification once it's approved or rejected.
                  </Alert>
                </Box>
              )}

              {/* Navigation */}
              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button variant="outlined" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/resources')}
                  sx={{ borderRadius: 2 }}>
                  {step === 0 ? 'Cancel' : 'Back'}
                </Button>
                {step < 2 ? (
                  <Button variant="contained" onClick={handleNext} sx={{ borderRadius: 2, px: 4 }}>
                    Next
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleSubmit} disabled={submitting}
                    sx={{ borderRadius: 2, px: 4 }}>
                    {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Booking'}
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* ── Right summary panel ───────────────────────────────────────── */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 80 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Booking Summary</Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Resource</Typography>
                  {resource ? (
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: tc.bg, color: tc.color }}>{tc.icon}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{resource.name}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">Not selected</Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Start Time</Typography>
                  <Typography variant="body2" fontWeight={form.startTime ? 600 : 400} color={form.startTime ? 'text.primary' : 'text.disabled'}>
                    {form.startTime ? new Date(form.startTime).toLocaleString() : 'Not set'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>End Time</Typography>
                  <Typography variant="body2" fontWeight={form.endTime ? 600 : 400} color={form.endTime ? 'text.primary' : 'text.disabled'}>
                    {form.endTime ? new Date(form.endTime).toLocaleString() : 'Not set'}
                  </Typography>
                </Box>

                {form.startTime && form.endTime && form.endTime > form.startTime && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Duration</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {Math.round((new Date(form.endTime) - new Date(form.startTime)) / 60000)} minutes
                    </Typography>
                  </Box>
                )}

                {resource?.location && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">{resource.location}</Typography>
                  </Box>
                )}
                {resource?.capacity && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">Capacity: {resource.capacity}</Typography>
                  </Box>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />
              <Chip label="Status: PENDING on submission" size="small"
                sx={{ bgcolor: '#FFF8E1', color: '#F57F17', fontWeight: 700 }} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default BookingFormPage
