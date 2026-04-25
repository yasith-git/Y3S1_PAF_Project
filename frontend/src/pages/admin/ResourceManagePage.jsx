import { useState, useEffect, useCallback } from 'react'
import {
  Box, Container, Grid, Typography, Button, Chip, Paper, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
  CircularProgress, InputAdornment, Stack, Alert, Divider, Card,
  CardContent, Pagination, useTheme, Skeleton,
} from '@mui/material'
import AddIcon         from '@mui/icons-material/Add'
import EditIcon        from '@mui/icons-material/Edit'
import DeleteIcon      from '@mui/icons-material/Delete'
import SearchIcon      from '@mui/icons-material/Search'
import ClearIcon       from '@mui/icons-material/Clear'
import RefreshIcon     from '@mui/icons-material/Refresh'
import SchoolIcon      from '@mui/icons-material/School'
import ScienceIcon     from '@mui/icons-material/Science'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import DevicesIcon     from '@mui/icons-material/Devices'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon     from '@mui/icons-material/Warning'
import ErrorIcon       from '@mui/icons-material/Error'
import DashboardIcon   from '@mui/icons-material/Dashboard'
import {
  searchResources, createResource, updateResource,
  updateResourceStatus, deleteResource, getResourceStats,
} from '../../api/resourceApi'
import toast from 'react-hot-toast'

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  LECTURE_HALL: { label: 'Lecture Hall',  icon: <SchoolIcon />,      color: '#1565C0', bg: '#E3F2FD' },
  LAB:          { label: 'Lab',           icon: <ScienceIcon />,     color: '#2E7D32', bg: '#E8F5E9' },
  MEETING_ROOM: { label: 'Meeting Room',  icon: <MeetingRoomIcon />, color: '#E65100', bg: '#FFF3E0' },
  EQUIPMENT:    { label: 'Equipment',     icon: <DevicesIcon />,     color: '#6A1B9A', bg: '#F3E5F5' },
}
const STATUS_CONFIG = {
  ACTIVE:            { label: 'Active',            color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  OUT_OF_SERVICE:    { label: 'Out of Service',    color: '#C62828', bg: '#FFEBEE', icon: <ErrorIcon sx={{ fontSize: 14 }} /> },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', color: '#F57F17', bg: '#FFF8E1', icon: <WarningIcon sx={{ fontSize: 14 }} /> },
}
const EMPTY_FORM = {
  name: '', type: 'LECTURE_HALL', capacity: '', location: '',
  building: '', description: '', features: '', availabilityWindows: '', imageUrl: '',
}

// ─── Stats card ───────────────────────────────────────────────────────────────
const StatsCard = ({ label, value, icon, color, bg, subtitle }) => (
  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider',
    transition: 'all .2s', '&:hover': { boxShadow: 4 } }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
      <Avatar sx={{ bgcolor: bg, color, width: 52, height: 52 }}>{icon}</Avatar>
      <Box>
        <Typography variant="h4" fontWeight={800} color={color}>{value ?? '—'}</Typography>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </CardContent>
  </Card>
)

// ─── Resource form dialog ─────────────────────────────────────────────────────
const ResourceFormDialog = ({ open, onClose, onSave, editData }) => {
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const isEdit = Boolean(editData)

  useEffect(() => {
    setForm(editData ? { ...EMPTY_FORM, ...editData } : EMPTY_FORM)
    setErrors({})
  }, [editData, open])

  const validate = () => {
    const e = {}
    if (!form.name.trim())     e.name     = 'Name is required'
    if (!form.location.trim()) e.location = 'Location is required'
    if (form.capacity && isNaN(Number(form.capacity))) e.capacity = 'Must be a number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : null }
      await onSave(payload, isEdit ? editData.id : null)
    } finally {
      setSaving(false)
    }
  }

  const F = ({ name, label, required, type, multiline, rows, helperText }) => (
    <TextField
      fullWidth label={label} value={form[name] || ''} size="small"
      required={required} type={type} multiline={multiline} rows={rows}
      error={Boolean(errors[name])} helperText={errors[name] || helperText}
      onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
    />
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>
        {isEdit ? 'Edit Resource' : 'Add New Resource'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={8}>
            <F name="name" label="Resource Name" required />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Type</InputLabel>
              <Select value={form.type} label="Type"
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: v.bg, color: v.color }}>{v.icon}</Avatar>
                      {v.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <F name="location" label="Location" required helperText="E.g. Block A, 2nd Floor" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <F name="building" label="Building" />
          </Grid>
          <Grid item xs={12} sm={2}>
            <F name="capacity" label="Capacity" type="number" />
          </Grid>
          <Grid item xs={12}>
            <F name="description" label="Description" multiline rows={3}
              helperText="A brief description of the resource" />
          </Grid>
          <Grid item xs={12}>
            <F name="features" label="Features" helperText="Comma-separated: Projector, AC, Whiteboard" />
          </Grid>
          <Grid item xs={12}>
            <F name="availabilityWindows" label="Availability Windows" multiline rows={2}
              helperText="E.g. Mon–Fri 08:00–20:00" />
          </Grid>
          <Grid item xs={12}>
            <F name="imageUrl" label="Image URL" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ borderRadius: 2, minWidth: 120 }}>
          {saving ? <CircularProgress size={20} /> : isEdit ? 'Save Changes' : 'Create Resource'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────
const DeleteDialog = ({ open, resource, onClose, onConfirm, deleting }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: 3 } }}>
    <DialogTitle sx={{ fontWeight: 700 }}>Delete Resource?</DialogTitle>
    <DialogContent>
      <Typography color="text.secondary">
        Are you sure you want to permanently delete <strong>{resource?.name}</strong>?
        This cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color="error" disabled={deleting}
        sx={{ borderRadius: 2, minWidth: 100 }}>
        {deleting ? <CircularProgress size={18} /> : 'Delete'}
      </Button>
    </DialogActions>
  </Dialog>
)

// ─── Status change select ─────────────────────────────────────────────────────
const StatusSelect = ({ resource, onChange }) => {
  const [loading, setLoading] = useState(false)
  const handleChange = async (e) => {
    setLoading(true)
    await onChange(resource.id, e.target.value)
    setLoading(false)
  }
  const sc = STATUS_CONFIG[resource.status] || {}
  return (
    <Select value={resource.status} onChange={handleChange} size="small" disabled={loading}
      sx={{ minWidth: 160, height: 30,
        bgcolor: sc.bg, color: sc.color, fontWeight: 700,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
        '& .MuiSvgIcon-root': { color: sc.color },
      }}>
      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
        <MenuItem key={k} value={k}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ color: v.color }}>{v.icon}</Box>
            <Typography variant="body2" fontWeight={600} color={v.color}>{v.label}</Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ResourceManagePage = () => {
  const [resources,  setResources]  = useState([])
  const [stats,      setStats]      = useState({})
  const [loading,    setLoading]    = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [page,       setPage]       = useState(0)

  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [formOpen,   setFormOpen]   = useState(false)
  const [editData,   setEditData]   = useState(null)
  const [delOpen,    setDelOpen]    = useState(false)
  const [delTarget,  setDelTarget]  = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  const loadResources = useCallback(async (kw = search, t = typeFilter, p = page) => {
    setLoading(true)
    try {
      const params = { page: p, size: 10 }
      if (kw) params.keyword = kw
      if (t)  params.type    = t
      const res = await searchResources(params)
      setResources(res.data.content || [])
      setTotalPages(res.data.totalPages || 1)
      setTotalItems(res.data.totalElements || 0)
    } catch { toast.error('Failed to load resources') }
    finally { setLoading(false) }
  }, [search, typeFilter, page])

  const loadStats = useCallback(async () => {
    try {
      const res = await getResourceStats()
      setStats(res.data || {})
    } catch {}
  }, [])

  useEffect(() => { loadResources(); loadStats() }, [page, typeFilter]) // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => loadResources(search, typeFilter, 0), 350)
    setPage(0)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await updateResource(id, payload)
        toast.success('Resource updated')
      } else {
        await createResource(payload)
        toast.success('Resource created')
      }
      setFormOpen(false)
      setEditData(null)
      loadResources(); loadStats()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed')
      throw err
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateResourceStatus(id, { status })
      setResources(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success('Status updated')
      loadStats()
    } catch { toast.error('Failed to update status') }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteResource(delTarget.id)
      toast.success('Resource deleted')
      setDelOpen(false)
      setDelTarget(null)
      loadResources(); loadStats()
    } catch { toast.error('Delete failed') }
    finally { setDeleting(false) }
  }

  const totalResources = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 3 }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main' }}><DashboardIcon /></Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800}>Resource Management</Typography>
                <Typography variant="body2" color="text.secondary">Admin · Facilities & Assets</Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1.5}>
              <Tooltip title="Refresh">
                <IconButton onClick={() => { loadResources(); loadStats() }}><RefreshIcon /></IconButton>
              </Tooltip>
              <Button variant="contained" startIcon={<AddIcon />}
                onClick={() => { setEditData(null); setFormOpen(true) }}
                sx={{ borderRadius: 2, fontWeight: 700 }}>
                Add Resource
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* ── Stats cards ─────────────────────────────────────────────────── */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatsCard label="Total Resources" value={totalResources} icon={<DashboardIcon />} color="#1565C0" bg="#E3F2FD" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatsCard label="Active" value={stats.ACTIVE} icon={<CheckCircleIcon />} color="#2E7D32" bg="#E8F5E9" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatsCard label="Under Maintenance" value={stats.UNDER_MAINTENANCE} icon={<WarningIcon />} color="#F57F17" bg="#FFF8E1" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatsCard label="Out of Service" value={stats.OUT_OF_SERVICE} icon={<ErrorIcon />} color="#C62828" bg="#FFEBEE" />
          </Grid>
        </Grid>

        {/* Type breakdown */}
        <Grid container spacing={2} mb={3}>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <Grid item xs={6} sm={3} key={k}>
              <StatsCard label={v.label} value={stats[k]} icon={v.icon} color={v.color} bg={v.bg} />
            </Grid>
          ))}
        </Grid>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={5}>
              <TextField fullWidth size="small" placeholder="Search resources…"
                value={search} onChange={e => setSearch(e.target.value)}
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
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Type</InputLabel>
                <Select value={typeFilter} label="Filter by Type"
                  onChange={e => { setTypeFilter(e.target.value); setPage(0) }}>
                  <MenuItem value="">All Types</MenuItem>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Typography variant="body2" color="text.secondary">
                {totalItems} resource{totalItems !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Resource</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={j}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : resources.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No resources found</Typography>
                        </TableCell>
                      </TableRow>
                    )
                    : resources.map(r => {
                        const tc = TYPE_CONFIG[r.type] || {}
                        return (
                          <TableRow key={r.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: tc.bg, color: tc.color }}>
                                  {tc.icon}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>{r.name}</Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap maxWidth={200} display="block">
                                    {r.description}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={tc.label} size="small"
                                sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 600, fontSize: 11 }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{r.location}</Typography>
                              {r.building && <Typography variant="caption" color="text.secondary">{r.building}</Typography>}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{r.capacity ?? '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <StatusSelect resource={r} onChange={handleStatusChange} />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => { setEditData(r); setFormOpen(true) }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error"
                                  onClick={() => { setDelTarget(r); setDelOpen(true) }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
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

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <ResourceFormDialog
        open={formOpen} onClose={() => { setFormOpen(false); setEditData(null) }}
        onSave={handleSave} editData={editData}
      />
      <DeleteDialog
        open={delOpen} resource={delTarget}
        onClose={() => { setDelOpen(false); setDelTarget(null) }}
        onConfirm={handleDelete} deleting={deleting}
      />
    </Box>
  )
}

export default ResourceManagePage
