import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Grid, CircularProgress, Tooltip, Alert,
} from '@mui/material'
import AddIcon       from '@mui/icons-material/Add'
import EditIcon      from '@mui/icons-material/Edit'
import DeleteIcon    from '@mui/icons-material/Delete'
import PauseCircleIcon from '@mui/icons-material/PauseCircle'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
  searchResources, createResource, updateResource,
  updateResourceStatus, deleteResource, getResourceStats,
} from '../../api/resourceApi'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name: '', type: 'LECTURE_HALL', capacity: '', location: '', building: '',
  availabilityWindows: '', status: 'ACTIVE', description: '', features: '', imageUrl: '',
}

const STATUS_COLOR = { ACTIVE: 'success', OUT_OF_SERVICE: 'error', UNDER_MAINTENANCE: 'warning' }

const ResourceManagePage = () => {
  const [resources, setResources] = useState([])
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(false)

  // Dialog state
  const [dialogOpen,   setDialogOpen]   = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)   // null = create mode
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [resRes, statsRes] = await Promise.all([
        searchResources({ status: '', size: 100 }),
        getResourceStats(),
      ])
      setResources(resRes.data.content)
      setStats(statsRes.data)
    } catch {
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (r) => {
    setEditTarget(r)
    setForm({
      name: r.name, type: r.type, capacity: r.capacity ?? '',
      location: r.location, building: r.building ?? '',
      availabilityWindows: r.availabilityWindows ?? '',
      status: r.status, description: r.description ?? '',
      features: r.features ?? '', imageUrl: r.imageUrl ?? '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.type || !form.location) {
      toast.error('Name, type and location are required')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : null }
      if (editTarget) {
        await updateResource(editTarget.id, payload)
        toast.success('Resource updated')
      } else {
        await createResource(payload)
        toast.success('Resource created')
      }
      setDialogOpen(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusToggle = async (r) => {
    const newStatus = r.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE'
    try {
      await updateResourceStatus(r.id, newStatus)
      toast.success(`Status changed to ${newStatus.replace(/_/g, ' ')}`)
      fetchAll()
    } catch {
      toast.error('Status update failed')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteResource(deleteTarget.id)
      toast.success('Resource deleted')
      setDeleteDialogOpen(false)
      fetchAll()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary">
            Manage Resources
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin · Facilities & Assets Catalogue
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Resource
        </Button>
      </Box>

      {/* Stats */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total',       val: stats.total,           color: 'primary' },
            { label: 'Active',      val: stats.active,          color: 'success.main' },
            { label: 'Out of Svc',  val: stats.outOfService,    color: 'error.main' },
            { label: 'Maintenance', val: stats.underMaintenance, color: 'warning.main' },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} color={s.color}>{s.val}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['ID', 'Name', 'Type', 'Location', 'Capacity', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell><Typography fontWeight={600}>{r.name}</Typography></TableCell>
                  <TableCell>
                    <Chip label={r.type.replace(/_/g, ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{r.location}{r.building ? ` · ${r.building}` : ''}</TableCell>
                  <TableCell>{r.capacity ?? '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.status.replace(/_/g, ' ')}
                      color={STATUS_COLOR[r.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => openEdit(r)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                      <IconButton size="small"
                        color={r.status === 'ACTIVE' ? 'warning' : 'success'}
                        onClick={() => handleStatusToggle(r)}>
                        {r.status === 'ACTIVE'
                          ? <PauseCircleIcon fontSize="small" />
                          : <CheckCircleIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error"
                        onClick={() => { setDeleteTarget(r); setDeleteDialogOpen(true) }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {resources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Alert severity="info">No resources found. Click "Add Resource" to create one.</Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Name *" value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Type *</InputLabel>
                <Select value={form.type} label="Type *"
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                  {['LECTURE_HALL','LAB','MEETING_ROOM','EQUIPMENT'].map((t) => (
                    <MenuItem key={t} value={t}>{t.replace(/_/g,' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Location *" value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Building / Floor" value={form.building}
                onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label="Capacity" type="number" value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status"
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  {['ACTIVE','OUT_OF_SERVICE','UNDER_MAINTENANCE'].map((s) => (
                    <MenuItem key={s} value={s}>{s.replace(/_/g,' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Availability Windows"
                placeholder='e.g. Mon-Fri 08:00-20:00'
                value={form.availabilityWindows}
                onChange={(e) => setForm((p) => ({ ...p, availabilityWindows: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Features (comma-separated)"
                placeholder="Projector, AC, Whiteboard, HDMI"
                value={form.features}
                onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Image URL" value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editTarget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Resource</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ResourceManagePage
