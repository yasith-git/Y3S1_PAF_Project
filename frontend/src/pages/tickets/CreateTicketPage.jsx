import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Paper, Typography, TextField, Button, Stepper, Step, StepLabel,
  MenuItem, Chip, IconButton, LinearProgress, Alert, Divider, Grid, Tooltip,
  CircularProgress
} from '@mui/material'
import {
  BugReport, Image as ImageIcon, Close, CloudUpload, CheckCircle,
  LowPriority, ArrowUpward, PriorityHigh, Error as ErrorIcon, Send
} from '@mui/icons-material'
import { createTicket } from '../../api/ticketApi'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Hardware Issue', 'Software Issue', 'Network Problem', 'Classroom Equipment',
  'Lab Equipment', 'Printing', 'Access/Login', 'Facilities', 'Other'
]

const PRIORITIES = [
  { value: 'LOW',      label: 'Low',      color: 'success', Icon: LowPriority  },
  { value: 'MEDIUM',   label: 'Medium',   color: 'info',    Icon: ArrowUpward  },
  { value: 'HIGH',     label: 'High',     color: 'warning', Icon: PriorityHigh },
  { value: 'CRITICAL', label: 'Critical', color: 'error',   Icon: ErrorIcon    },
]

const STEPS = ['Describe Issue', 'Add Details & Images', 'Review & Submit']
const MAX_IMAGES = 3
const MAX_SIZE   = 5 * 1024 * 1024

// ─── Helpers ──────────────────────────────────────────────────────────────────
const priorityMeta = (val) => PRIORITIES.find(p => p.value === val) || PRIORITIES[1]

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateTicketPage() {
  const navigate = useNavigate()

  const [step,     setStep]     = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(null)

  // Form state
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('')
  const [priority,    setPriority]    = useState('MEDIUM')
  const [images,      setImages]      = useState([])   // { file, preview }
  const [errors,      setErrors]      = useState({})

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate0 = () => {
    const e = {}
    if (!title.trim() || title.trim().length < 5) e.title = 'Title must be at least 5 characters'
    if (!description.trim() || description.trim().length < 10)
      e.description = 'Description must be at least 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (step === 0 && !validate0()) return
    setStep(s => s + 1)
  }
  const handleBack = () => setStep(s => s - 1)

  // ── Image handling ──────────────────────────────────────────────────────────
  const handleImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    const remaining = MAX_IMAGES - images.length
    const added = []
    files.slice(0, remaining).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: only images allowed`)
        return
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: exceeds 5 MB limit`)
        return
      }
      added.push({ file, preview: URL.createObjectURL(file) })
    })
    setImages(prev => [...prev, ...added])
    e.target.value = ''
  }, [images.length])

  const removeImage = (idx) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('data', new Blob([JSON.stringify({ title, description, category, priority })],
                                  { type: 'application/json' }))
      images.forEach(({ file }) => fd.append('images', file))
      const res = await createTicket(fd)
      setSuccess(res.data)
      toast.success('Ticket submitted successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" fontWeight={800} gutterBottom>Ticket Submitted!</Typography>
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          Your ticket <strong>#{success.id}</strong> has been received and is under review.
        </Typography>
        <Chip label={`Status: ${success.status}`} color="primary" sx={{ mb: 4 }} />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/tickets/my')}>
            View My Tickets
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/tickets/${success.id}`)}>
            View Ticket
          </Button>
        </Box>
      </Container>
    )
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  const pm = priorityMeta(priority)

  return (
    <Box sx={{ background: 'linear-gradient(135deg,#E3F2FD 0%,#F1F8E9 100%)', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 3,
            background: 'linear-gradient(135deg,#1565C0,#0D47A1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BugReport sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Report an Issue</Typography>
            <Typography color="text.secondary">
              Help us improve campus operations — describe what went wrong.
            </Typography>
          </Box>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>

          {/* Step 0 — Describe Issue */}
          {step === 0 && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>What happened?</Typography>

              <TextField
                label="Issue Title"
                fullWidth
                value={title}
                onChange={e => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title || `${title.length}/255`}
                inputProps={{ maxLength: 255 }}
                sx={{ mb: 3 }}
                placeholder="e.g. Projector not working in Room 201"
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description || 'Provide as much detail as possible'}
                sx={{ mb: 3 }}
                placeholder="Describe the issue clearly: what, where, when, and any steps to reproduce..."
              />

              {/* Priority selector */}
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Priority</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                {PRIORITIES.map(({ value, label, color, Icon }) => (
                  <Chip
                    key={value}
                    label={label}
                    icon={<Icon />}
                    color={priority === value ? color : 'default'}
                    variant={priority === value ? 'filled' : 'outlined'}
                    onClick={() => setPriority(value)}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Step 1 — Category & Images */}
          {step === 1 && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Category & Evidence</Typography>

              <TextField
                select
                label="Category"
                fullWidth
                value={category}
                onChange={e => setCategory(e.target.value)}
                sx={{ mb: 4 }}
              >
                <MenuItem value=""><em>Select a category (optional)</em></MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>

              {/* Image upload */}
              <Box sx={{
                border: '2px dashed',
                borderColor: images.length < MAX_IMAGES ? 'primary.light' : 'divider',
                borderRadius: 3, p: 3, textAlign: 'center', mb: 3,
                bgcolor: 'primary.50',
                cursor: images.length < MAX_IMAGES ? 'pointer' : 'not-allowed',
              }}
                onClick={() => images.length < MAX_IMAGES &&
                  document.getElementById('ticket-images').click()}
              >
                <input
                  id="ticket-images"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageSelect}
                />
                <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography fontWeight={600}>
                  {images.length < MAX_IMAGES
                    ? `Upload images (${images.length}/${MAX_IMAGES})`
                    : 'Maximum images reached'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  JPEG, PNG, WEBP — max 5 MB each
                </Typography>
              </Box>

              {/* Previews */}
              {images.length > 0 && (
                <Grid container spacing={2}>
                  {images.map(({ preview }, i) => (
                    <Grid item xs={4} key={i}>
                      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden',
                                 boxShadow: 1 }}>
                        <Box
                          component="img"
                          src={preview}
                          sx={{ width: '100%', height: 140, objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeImage(i)}
                          sx={{
                            position: 'absolute', top: 4, right: 4,
                            bgcolor: 'rgba(0,0,0,.55)', color: '#fff',
                            '&:hover': { bgcolor: 'error.main' }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                        <Chip
                          label={`Image ${i + 1}`}
                          size="small"
                          sx={{ position: 'absolute', bottom: 6, left: 6,
                                bgcolor: 'rgba(0,0,0,.55)', color: '#fff', fontWeight: 600 }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Step 2 — Review */}
          {step === 2 && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Review Your Ticket</Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please review the details before submitting. You can go back to make changes.
              </Alert>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">TITLE</Typography>
                    <Typography fontWeight={700}>{title}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">PRIORITY</Typography>
                    <Box>
                      <Chip
                        label={pm.label}
                        color={pm.color}
                        size="small"
                        sx={{ fontWeight: 700, mt: 0.5 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">CATEGORY</Typography>
                    <Typography fontWeight={600}>{category || '—'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary">DESCRIPTION</Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{description}</Typography>
                  </Grid>
                  {images.length > 0 && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        ATTACHMENTS ({images.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {images.map(({ preview }, i) => (
                          <Box key={i} component="img" src={preview}
                               sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover',
                                     border: '1px solid', borderColor: 'divider' }} />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          )}

          {/* Navigation */}
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={step === 0 ? () => navigate(-1) : handleBack}
              disabled={loading}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Send />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg,#1565C0,#0D47A1)',
                  px: 4
                }}
              >
                {loading ? 'Submitting…' : 'Submit Ticket'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
