import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  CardActionArea, Avatar, Chip, Paper, IconButton, Fade, Zoom,
  useTheme, useMediaQuery,
} from '@mui/material'
import SchoolIcon          from '@mui/icons-material/School'
import MeetingRoomIcon     from '@mui/icons-material/MeetingRoom'
import ScienceIcon         from '@mui/icons-material/Science'
import DevicesIcon         from '@mui/icons-material/Devices'
import CalendarMonthIcon   from '@mui/icons-material/CalendarMonth'
import ReportProblemIcon   from '@mui/icons-material/ReportProblem'
import NotificationsIcon   from '@mui/icons-material/Notifications'
import SecurityIcon        from '@mui/icons-material/Security'
import ArrowForwardIcon    from '@mui/icons-material/ArrowForward'
import CheckCircleIcon     from '@mui/icons-material/CheckCircle'
import GroupsIcon          from '@mui/icons-material/Groups'
import BuildIcon           from '@mui/icons-material/Build'
import { useAuth } from '../context/AuthContext'
import { searchResources } from '../api/resourceApi'

// ─── Static data ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <CalendarMonthIcon sx={{ fontSize: 40 }} />,
    title: 'Smart Booking',
    desc: 'Reserve lecture halls, labs and meeting rooms in seconds. Real-time conflict detection keeps schedules clean.',
    color: '#1565C0',
    bg: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)',
  },
  {
    icon: <ReportProblemIcon sx={{ fontSize: 40 }} />,
    title: 'Incident Tickets',
    desc: 'Report faults with photo evidence. Track resolution progress from OPEN to CLOSED with automated notifications.',
    color: '#C62828',
    bg: 'linear-gradient(135deg,#FFEBEE,#FFCDD2)',
  },
  {
    icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
    title: 'Live Notifications',
    desc: 'Never miss an update. Get instant alerts for booking approvals, ticket status changes and new comments.',
    color: '#E65100',
    bg: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'Secure & Role-Based',
    desc: 'Google OAuth 2.0 login with fine-grained role access. USER, ADMIN and TECHNICIAN roles keep data safe.',
    color: '#2E7D32',
    bg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)',
  },
]

const RESOURCE_TYPES = [
  { type: 'LECTURE_HALL',  label: 'Lecture Halls',  icon: <SchoolIcon />,      color: '#1565C0' },
  { type: 'LAB',           label: 'Labs',            icon: <ScienceIcon />,     color: '#2E7D32' },
  { type: 'MEETING_ROOM',  label: 'Meeting Rooms',   icon: <MeetingRoomIcon />, color: '#E65100' },
  { type: 'EQUIPMENT',     label: 'Equipment',       icon: <DevicesIcon />,     color: '#6A1B9A' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign In',        desc: 'Log in with your university Google account securely via OAuth 2.0.' },
  { step: '02', title: 'Find a Resource', desc: 'Browse the catalogue, filter by type or location, check availability.' },
  { step: '03', title: 'Make a Booking', desc: 'Submit your booking request with date, time range and purpose.' },
  { step: '04', title: 'Get Approved',   desc: 'Admin reviews and approves. You\'ll be notified instantly.' },
]

// ─── Animated counter hook ────────────────────────────────────────────────────
const useCounter = (end, duration = 1800) => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return count
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard = ({ value, label, icon, color }) => {
  const count = useCounter(value)
  return (
    <Paper elevation={0} sx={{
      textAlign: 'center', p: 3, borderRadius: 3,
      border: '1px solid', borderColor: 'divider',
      transition: 'transform .2s,box-shadow .2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
    }}>
      <Box sx={{ color, mb: 1 }}>{icon}</Box>
      <Typography variant="h3" fontWeight={800} color={color}>{count}+</Typography>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
    </Paper>
  )
}

const ResourceTypeCard = ({ item, onClick }) => (
  <Card sx={{
    cursor: 'pointer', borderRadius: 3, border: '2px solid transparent',
    transition: 'all .25s',
    '&:hover': { borderColor: item.color, transform: 'translateY(-6px)', boxShadow: 6 },
  }} onClick={onClick}>
    <CardContent sx={{ textAlign: 'center', py: 4 }}>
      <Avatar sx={{ bgcolor: item.color + '22', color: item.color, width: 64, height: 64, mx: 'auto', mb: 2 }}>
        {item.icon}
      </Avatar>
      <Typography variant="h6" fontWeight={700}>{item.label}</Typography>
      <Typography variant="caption" color="text.secondary">Click to browse</Typography>
    </CardContent>
  </Card>
)

// ─── Main component ───────────────────────────────────────────────────────────
const HomePage = () => {
  const { isLoggedIn } = useAuth()
  const navigate       = useNavigate()
  const theme          = useTheme()
  const isMobile       = useMediaQuery(theme.breakpoints.down('sm'))
  const [recentResources, setRecentResources] = useState([])

  useEffect(() => {
    searchResources({ size: 6, status: 'ACTIVE' })
      .then(r => setRecentResources(r.data.content || []))
      .catch(() => {})
  }, [])

  return (
    <Box>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #00695C 100%)',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
      }}>
        {/* Decorative circles */}
        {[200, 350, 500].map((size, i) => (
          <Box key={i} sx={{
            position: 'absolute',
            width: size, height: size,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,.08)',
            top: '50%', left: '60%',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
          }} />
        ))}

        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Fade in timeout={800}>
                <Box>
                  <Chip label="SLIIT Smart Campus" sx={{ bgcolor: 'rgba(255,255,255,.15)', color: 'white', mb: 2, fontWeight: 600 }} />
                  <Typography variant={isMobile ? 'h3' : 'h1'} fontWeight={800} gutterBottom sx={{ lineHeight: 1.15 }}>
                    Smart Campus<br />
                    <Box component="span" sx={{ color: '#80DEEA' }}>Operations Hub</Box>
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: .85, mb: 4, maxWidth: 540, lineHeight: 1.7 }}>
                    One platform to manage all facility bookings, equipment reservations and maintenance incidents. Built for SLIIT's modern campus needs.
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/resources')}
                      sx={{ bgcolor: 'white', color: '#1565C0', fontWeight: 700, px: 4, py: 1.5, borderRadius: 3,
                            '&:hover': { bgcolor: '#E3F2FD' } }}
                    >
                      Browse Resources
                    </Button>
                    {!isLoggedIn && (
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/login')}
                        sx={{ borderColor: 'white', color: 'white', px: 4, py: 1.5, borderRadius: 3,
                              '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
                      >
                        Sign In
                      </Button>
                    )}
                    {isLoggedIn && (
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/bookings/new')}
                        sx={{ borderColor: 'white', color: 'white', px: 4, py: 1.5, borderRadius: 3,
                              '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
                      >
                        Make a Booking
                      </Button>
                    )}
                  </Box>

                  {/* Trust badges */}
                  <Box display="flex" gap={3} mt={5} flexWrap="wrap">
                    {['Conflict-Free Scheduling', 'OAuth 2.0 Secured', 'Real-Time Notifications'].map(t => (
                      <Box key={t} display="flex" alignItems="center" gap={0.5}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: '#80DEEA' }} />
                        <Typography variant="body2" sx={{ opacity: .9 }}>{t}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Fade>
            </Grid>

            {/* Hero illustration cards */}
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Zoom in timeout={1000}>
                <Box sx={{ position: 'relative' }}>
                  {[
                    { top: 0,   left: 0,   label: 'LH-101',         sub: 'Lecture Hall · Capacity 120', icon: <SchoolIcon />,      color: '#1565C0' },
                    { top: 140, left: 80,  label: 'Lab B-204',       sub: 'Computer Lab · Capacity 40',  icon: <ScienceIcon />,     color: '#2E7D32' },
                    { top: 280, left: 0,   label: 'Meeting Room 3A', sub: 'Conference · Capacity 12',    icon: <MeetingRoomIcon />, color: '#E65100' },
                  ].map((c, i) => (
                    <Paper key={i} sx={{
                      position: 'absolute', top: c.top, left: c.left,
                      p: 2, borderRadius: 3, minWidth: 220,
                      display: 'flex', gap: 1.5, alignItems: 'center',
                      boxShadow: '0 8px 32px rgba(0,0,0,.18)',
                      animation: `float${i} 3s ease-in-out infinite`,
                    }}>
                      <Avatar sx={{ bgcolor: c.color + '22', color: c.color }}>{c.icon}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{c.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.sub}</Typography>
                      </Box>
                      <Chip label="ACTIVE" size="small" sx={{ ml: 'auto', bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }} />
                    </Paper>
                  ))}
                  <Box sx={{ height: 380 }} /> {/* Spacer */}
                </Box>
              </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: -5, position: 'relative', zIndex: 10 }}>
        <Grid container spacing={2}>
          {[
            { value: 48,  label: 'Total Resources',    icon: <BuildIcon sx={{ fontSize: 32 }} />,     color: '#1565C0' },
            { value: 320, label: 'Bookings This Month', icon: <CalendarMonthIcon sx={{ fontSize: 32 }} />, color: '#2E7D32' },
            { value: 15,  label: 'Open Tickets',        icon: <ReportProblemIcon sx={{ fontSize: 32 }} />, color: '#C62828' },
            { value: 280, label: 'Active Users',         icon: <GroupsIcon sx={{ fontSize: 32 }} />,    color: '#E65100' },
          ].map(s => (
            <Grid item xs={6} md={3} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── Resource Type Quick Access ─────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Box textAlign="center" mb={5}>
          <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>
            Browse by Category
          </Typography>
          <Typography variant="h3" fontWeight={800} mt={1}>
            What are you looking for?
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {RESOURCE_TYPES.map(rt => (
            <Grid item xs={6} md={3} key={rt.type}>
              <ResourceTypeCard
                item={rt}
                onClick={() => navigate(`/resources?type=${rt.type}`)}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'grey.50', mt: 10, py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>
              Platform Features
            </Typography>
            <Typography variant="h3" fontWeight={800} mt={1}>
              Everything you need
            </Typography>
            <Typography variant="h6" color="text.secondary" mt={1} maxWidth={500} mx="auto">
              A fully integrated platform designed to streamline campus operations.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {FEATURES.map(f => (
              <Grid item xs={12} sm={6} md={3} key={f.title}>
                <Card elevation={0} sx={{
                  height: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider',
                  transition: 'all .25s',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: 6 },
                }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ p: 1.5, borderRadius: 3, background: f.bg, display: 'inline-flex', mb: 2.5, color: f.color }}>
                      {f.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>Simple Process</Typography>
          <Typography variant="h3" fontWeight={800} mt={1}>How it works</Typography>
        </Box>
        <Grid container spacing={4}>
          {HOW_IT_WORKS.map((h, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Box textAlign="center">
                <Typography variant="h2" fontWeight={900} sx={{ color: 'primary.main', opacity: .12, lineHeight: 1 }}>
                  {h.step}
                </Typography>
                <Typography variant="h6" fontWeight={700} mt={-2} mb={1}>{h.title}</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{h.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── Recent Available Resources ─────────────────────────────────────── */}
      {recentResources.length > 0 && (
        <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
          <Container maxWidth="lg">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box>
                <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>Right Now</Typography>
                <Typography variant="h4" fontWeight={800}>Available Resources</Typography>
              </Box>
              <Button variant="outlined" endIcon={<ArrowForwardIcon />} component={Link} to="/resources">
                View All
              </Button>
            </Box>
            <Grid container spacing={3}>
              {recentResources.slice(0, 6).map(r => (
                <Grid item xs={12} sm={6} md={4} key={r.id}>
                  <Card sx={{
                    borderRadius: 3, cursor: 'pointer',
                    transition: 'all .25s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                  }}
                    onClick={() => navigate(`/resources/${r.id}`)}>
                    <Box sx={{ height: 6, background: r.type === 'LECTURE_HALL' ? '#1565C0' : r.type === 'LAB' ? '#2E7D32' : r.type === 'MEETING_ROOM' ? '#E65100' : '#6A1B9A' }} />
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle1" fontWeight={700}>{r.name}</Typography>
                        <Chip label={r.status} size="small" sx={{
                          bgcolor: r.status === 'ACTIVE' ? '#E8F5E9' : '#FFEBEE',
                          color: r.status === 'ACTIVE' ? '#2E7D32' : '#C62828',
                          fontWeight: 700, fontSize: 10,
                        }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">{r.location}</Typography>
                      {r.capacity && (
                        <Typography variant="caption" color="text.secondary">
                          Capacity: {r.capacity}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
        py: 8, color: 'white', textAlign: 'center',
      }}>
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight={800} gutterBottom>Ready to get started?</Typography>
          <Typography variant="body1" sx={{ opacity: .85, mb: 4 }}>
            Sign in with your university Google account and start booking resources today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(isLoggedIn ? '/resources' : '/login')}
            sx={{ bgcolor: 'white', color: '#1565C0', px: 5, py: 1.5, fontWeight: 700, borderRadius: 3 }}
          >
            {isLoggedIn ? 'Browse Resources' : 'Get Started Now'}
          </Button>
        </Container>
      </Box>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#0D1117', color: 'grey.400', py: 4 }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography variant="body2">© 2026 Smart Campus Operations Hub · SLIIT · IT3030 PAF</Typography>
            <Box display="flex" gap={3}>
              <Typography variant="body2" component={Link} to="/resources" sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}>Resources</Typography>
              <Typography variant="body2" component={Link} to="/bookings/my" sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}>Bookings</Typography>
              <Typography variant="body2" component={Link} to="/tickets/my" sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}>Tickets</Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default HomePage
