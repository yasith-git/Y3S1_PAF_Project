import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Typography, Grid, Card, CardContent, CardActions,
  Chip, Button, Tabs, Tab, Skeleton, Avatar, Divider, IconButton, Tooltip,
  TextField, InputAdornment, Menu, MenuItem
} from '@mui/material'
import {
  BugReport, Search, Add, OpenInNew, Schedule, Category,
  FilterList, Sort, ArrowDropDown
} from '@mui/icons-material'
import { getMyTickets } from '../../api/ticketApi'
import toast from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

const STATUS_META = {
  OPEN:        { label: 'Open',        color: 'primary' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning' },
  RESOLVED:    { label: 'Resolved',    color: 'success' },
  CLOSED:      { label: 'Closed',      color: 'default' },
}

const PRIORITY_META = {
  LOW:      { label: 'Low',      color: 'success' },
  MEDIUM:   { label: 'Medium',   color: 'info'    },
  HIGH:     { label: 'High',     color: 'warning' },
  CRITICAL: { label: 'Critical', color: 'error'   },
}

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest First'  },
  { value: 'oldest',   label: 'Oldest First'  },
  { value: 'priority', label: 'By Priority'   },
]

const PRIORITY_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── TicketCard ───────────────────────────────────────────────────────────────
function TicketCard({ ticket, onView }) {
  const sm = STATUS_META[ticket.status]   || STATUS_META.OPEN
  const pm = PRIORITY_META[ticket.priority] || PRIORITY_META.MEDIUM

  return (
    <Card sx={{
      borderRadius: 3, transition: 'all .2s',
      borderLeft: `4px solid`,
      borderLeftColor:
        ticket.priority === 'CRITICAL' ? 'error.main' :
        ticket.priority === 'HIGH'     ? 'warning.main' :
        ticket.priority === 'MEDIUM'   ? 'info.main'    : 'success.main',
      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
    }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            #{ticket.id}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Chip label={pm.label} color={pm.color} size="small" sx={{ fontWeight: 700 }} />
            <Chip label={sm.label} color={sm.color} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </Box>
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
          {ticket.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', mb: 2
        }}>
          {ticket.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {ticket.category && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Category sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">{ticket.category}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {relativeTime(ticket.createdAt)}
            </Typography>
          </Box>
          {ticket.assigneeName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Avatar sx={{ width: 18, height: 18, fontSize: 10 }}>
                {ticket.assigneeName[0]}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {ticket.assigneeName}
              </Typography>
            </Box>
          )}
          {ticket.attachments?.length > 0 && (
            <Chip
              icon={<BugReport sx={{ fontSize: '14px !important' }} />}
              label={`${ticket.attachments.length} image${ticket.attachments.length > 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 11 }}
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          size="small"
          variant="outlined"
          endIcon={<OpenInNew sx={{ fontSize: '14px !important' }} />}
          onClick={() => onView(ticket.id)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TicketSkeleton() {
  return (
    <Card sx={{ borderRadius: 3, borderLeft: '4px solid #E0E0E0' }}>
      <CardContent>
        <Skeleton width={60} height={20} sx={{ mb: 1 }} />
        <Skeleton width="80%" height={28} sx={{ mb: 1 }} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="60%"  height={20} />
      </CardContent>
    </Card>
  )
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ value, label, color = 'primary' }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h4" fontWeight={800} color={`${color}.main`}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyTicketsPage() {
  const navigate = useNavigate()

  const [tickets,  setTickets]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState(0)
  const [search,   setSearch]   = useState('')
  const [sortBy,   setSortBy]   = useState('newest')
  const [sortAnchor, setSortAnchor] = useState(null)

  useEffect(() => {
    getMyTickets()
      .then(r => setTickets(r.data))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false))
  }, [])

  // Filtered + sorted
  const filtered = tickets
    .filter(t => {
      const statusMatch = tab === 0 || t.status === STATUS_TABS[tab]
      const searchMatch = !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      return statusMatch && searchMatch
    })
    .sort((a, b) => {
      if (sortBy === 'newest')   return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'oldest')   return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'priority') return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
      return 0
    })

  const countFor = useCallback((status) =>
    tickets.filter(t => status === 'ALL' || t.status === status).length, [tickets])

  const stats = {
    total:      tickets.length,
    open:       tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved:   tickets.filter(t => t.status === 'RESOLVED').length,
  }

  return (
    <Box sx={{ background: '#F8FAFC', minHeight: '100vh' }}>
      {/* Hero header */}
      <Box sx={{
        background: 'linear-gradient(135deg,#1A237E 0%,#1565C0 50%,#00695C 100%)',
        py: 6, color: '#fff'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" fontWeight={900} gutterBottom>My Tickets</Typography>
              <Typography sx={{ opacity: .85 }}>
                Track issues you've reported and follow their progress.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/tickets/new')}
              sx={{ bgcolor: 'rgba(255,255,255,.2)', backdropFilter: 'blur(4px)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,.3)' } }}
            >
              Report Issue
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { value: stats.total,      label: 'Total',       color: 'primary' },
            { value: stats.open,       label: 'Open',        color: 'info'    },
            { value: stats.inProgress, label: 'In Progress', color: 'warning' },
            { value: stats.resolved,   label: 'Resolved',    color: 'success' },
          ].map(s => (
            <Grid item xs={6} md={3} key={s.label}>
              {loading ? <Skeleton height={90} sx={{ borderRadius: 3 }} /> :
               <StatCard {...s} />}
            </Grid>
          ))}
        </Grid>

        {/* Toolbar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search tickets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
            }}
            sx={{ width: 280 }}
          />
          <Box sx={{ ml: 'auto' }}>
            <Button
              size="small"
              variant="outlined"
              endIcon={<ArrowDropDown />}
              onClick={e => setSortAnchor(e.currentTarget)}
            >
              <Sort sx={{ mr: 0.5, fontSize: 16 }} />
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
            </Button>
            <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)}
                  onClose={() => setSortAnchor(null)}>
              {SORT_OPTIONS.map(o => (
                <MenuItem key={o.value} selected={sortBy === o.value}
                          onClick={() => { setSortBy(o.value); setSortAnchor(null) }}>
                  {o.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, bgcolor: '#fff', borderRadius: 2, px: 1,
                boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}
        >
          {STATUS_TABS.map((s, i) => (
            <Tab
              key={s}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {s === 'ALL' ? 'All' : STATUS_META[s]?.label}
                  <Chip label={countFor(s)} size="small" sx={{ height: 18, fontSize: 11 }} />
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Ticket grid */}
        {loading ? (
          <Grid container spacing={2}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={12} md={6} key={i}><TicketSkeleton /></Grid>
            ))}
          </Grid>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
            <BugReport sx={{ fontSize: 64, opacity: .3, mb: 2 }} />
            <Typography variant="h6" fontWeight={600}>No tickets found</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              {search ? 'Try a different search term.' : 'You haven\'t reported any issues yet.'}
            </Typography>
            {!search && (
              <Button variant="contained" startIcon={<Add />}
                      onClick={() => navigate('/tickets/new')}>
                Report an Issue
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filtered.map(ticket => (
              <Grid item xs={12} md={6} key={ticket.id}>
                <TicketCard ticket={ticket} onView={id => navigate(`/tickets/${id}`)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
}
