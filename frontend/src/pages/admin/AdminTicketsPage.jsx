import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Typography, Grid, Card, CardContent, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Divider, Skeleton, Pagination
} from '@mui/material'
import {
  Search, Refresh, CheckCircle, Cancel, HourglassEmpty,
  Visibility, Delete, PersonSearch, TrendingUp
} from '@mui/icons-material'
import {
  getAllTickets, updateTicketStatus, deleteTicket, getTicketStats
} from '../../api/ticketApi'
import toast from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_META = {
  OPEN:        { label: 'Open',        color: 'primary',  bg: '#E3F2FD' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning',  bg: '#FFF3E0' },
  RESOLVED:    { label: 'Resolved',    color: 'success',  bg: '#E8F5E9' },
  CLOSED:      { label: 'Closed',      color: 'default',  bg: '#F5F5F5' },
}

const PRIORITY_META = {
  LOW:      { label: 'Low',      color: 'success' },
  MEDIUM:   { label: 'Medium',   color: 'info'    },
  HIGH:     { label: 'High',     color: 'warning' },
  CRITICAL: { label: 'Critical', color: 'error'   },
}

const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

const formatDate = (str) =>
  new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// ─── Review Dialog ────────────────────────────────────────────────────────────
function ReviewDialog({ open, ticket, onClose, onSave }) {
  const [status,   setStatus]   = useState('')
  const [assignee, setAssignee] = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (ticket) { setStatus(ticket.status); setAssignee(ticket.assigneeId || '') }
  }, [ticket])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(ticket.id, { status, assigneeId: assignee || null })
    } finally {
      setSaving(false)
    }
  }

  if (!ticket) return null

  const pm = PRIORITY_META[ticket.priority] || PRIORITY_META.MEDIUM

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Update Ticket #{ticket.id}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{ticket.title}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip label={ticket.status} size="small" color={STATUS_META[ticket.status]?.color || 'default'} />
          <Chip label={pm.label}      size="small" color={pm.color} />
          {ticket.category && <Chip label={ticket.category} size="small" variant="outlined" />}
        </Box>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={e => setStatus(e.target.value)}>
            {STATUS_FLOW.map(s => (
              <MenuItem key={s} value={s}>
                <Chip label={STATUS_META[s]?.label} color={STATUS_META[s]?.color} size="small" sx={{ pointerEvents: 'none' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Assignee ID (optional)"
          fullWidth
          type="number"
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
          helperText="Enter the user ID of the technician to assign"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={<CheckCircle />}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────
function DeleteDialog({ open, ticket, onClose, onConfirm, loading }) {
  if (!ticket) return null
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={800} color="error.main">Delete Ticket #{ticket.id}</DialogTitle>
      <Divider />
      <DialogContent>
        <Typography>
          Are you sure you want to permanently delete ticket <strong>"{ticket.title}"</strong>?
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color = 'primary', loading }) {
  return (
    <Card sx={{ borderRadius: 3, textAlign: 'center' }}>
      <CardContent sx={{ py: 2.5 }}>
        {loading ? <Skeleton width={50} height={44} sx={{ mx: 'auto' }} /> :
          <Typography variant="h4" fontWeight={800} color={`${color}.main`}>{value ?? 0}</Typography>}
        <Typography variant="caption" fontWeight={600} color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminTicketsPage() {
  const navigate = useNavigate()

  const [tickets,  setTickets]  = useState([])
  const [stats,    setStats]    = useState({})
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [keyword,  setKeyword]  = useState('')
  const [status,   setStatus]   = useState('')
  const [priority, setPriority] = useState('')

  const [reviewTicket, setReviewTicket] = useState(null)
  const [deleteTicketObj, setDeleteTicketObj] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const PAGE_SIZE = 15

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      getAllTickets({ status: status || undefined, priority: priority || undefined,
                     keyword: keyword || undefined, page: page - 1, size: PAGE_SIZE }),
      getTicketStats(),
    ]).then(([tr, sr]) => {
      setTickets(tr.data.content || [])
      setTotal(tr.data.totalElements || 0)
      setStats(sr.data)
    }).catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false))
  }, [status, priority, keyword, page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusUpdate = async (id, data) => {
    try {
      await updateTicketStatus(id, data)
      toast.success('Ticket updated')
      setReviewTicket(null)
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteTicket(deleteTicketObj.id)
      toast.success('Ticket deleted')
      setDeleteTicketObj(null)
      fetchData()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <Box sx={{ background: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg,#1A237E 0%,#283593 50%,#1565C0 100%)',
        py: 5, color: '#fff'
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" fontWeight={900} gutterBottom>Ticket Management</Typography>
              <Typography sx={{ opacity: .85 }}>
                Review, assign, and resolve campus support tickets.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined"
                      startIcon={<Refresh />}
                      onClick={fetchData}
                      sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)',
                            '&:hover': { borderColor: '#fff' } }}>
                Refresh
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { key: 'total',      label: 'Total',       color: 'primary' },
            { key: 'open',       label: 'Open',        color: 'info'    },
            { key: 'inProgress', label: 'In Progress', color: 'warning' },
            { key: 'resolved',   label: 'Resolved',    color: 'success' },
            { key: 'closed',     label: 'Closed',      color: 'default' },
          ].map(s => (
            <Grid item xs={6} sm={4} md={2.4} key={s.key}>
              <StatCard value={stats[s.key]} label={s.label} color={s.color} loading={loading} />
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search by title or description…"
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1) }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                }}
                sx={{ width: 320 }}
              />

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPage(1) }}>
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.entries(STATUS_META).map(([v, m]) => (
                    <MenuItem key={v} value={v}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Priority</InputLabel>
                <Select value={priority} label="Priority" onChange={e => { setPriority(e.target.value); setPage(1) }}>
                  <MenuItem value="">All Priorities</MenuItem>
                  {Object.entries(PRIORITY_META).map(([v, m]) => (
                    <MenuItem key={v} value={v}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {total} ticket{total !== 1 ? 's' : ''} found
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                {['#ID', 'Title', 'Reporter', 'Category', 'Priority', 'Status', 'Assignee', 'Created', 'Actions']
                  .map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map(ticket => {
                  const sm = STATUS_META[ticket.status]   || STATUS_META.OPEN
                  const pm = PRIORITY_META[ticket.priority] || PRIORITY_META.MEDIUM
                  return (
                    <TableRow key={ticket.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>#{ticket.id}</TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{ticket.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: 'primary.light' }}>
                            {ticket.reporterName?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">{ticket.reporterName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {ticket.category || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={pm.label} color={pm.color} size="small" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={sm.label} color={sm.color} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {ticket.assigneeName || 'Unassigned'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(ticket.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View">
                            <IconButton size="small" color="primary"
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update Status">
                            <IconButton size="small" color="warning"
                                        onClick={() => setReviewTicket(ticket)}>
                              <TrendingUp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error"
                                        onClick={() => setDeleteTicketObj(ticket)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Container>

      {/* Dialogs */}
      <ReviewDialog
        open={Boolean(reviewTicket)}
        ticket={reviewTicket}
        onClose={() => setReviewTicket(null)}
        onSave={handleStatusUpdate}
      />
      <DeleteDialog
        open={Boolean(deleteTicketObj)}
        ticket={deleteTicketObj}
        onClose={() => setDeleteTicketObj(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </Box>
  )
}
