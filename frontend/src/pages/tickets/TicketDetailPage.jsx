import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Container, Typography, Grid, Card, CardContent, Chip, Button,
  Divider, Avatar, TextField, CircularProgress, Skeleton, Alert,
  IconButton, Tooltip, Breadcrumbs, Link, Paper
} from '@mui/material'
import {
  ArrowBack, Send, AttachFile, Person, Schedule,
  Category, PriorityHigh, Image as ImageIcon, OpenInNew
} from '@mui/icons-material'
import { getTicketById, getComments, addComment } from '../../api/ticketApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

const PRIORITY_GRADIENT = {
  CRITICAL: 'linear-gradient(135deg,#B71C1C,#C62828)',
  HIGH:     'linear-gradient(135deg,#E65100,#F57C00)',
  MEDIUM:   'linear-gradient(135deg,#1565C0,#1976D2)',
  LOW:      'linear-gradient(135deg,#2E7D32,#388E3C)',
}

const formatDateTime = (str) =>
  new Date(str).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

// ─── InfoRow ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, valueEl }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.50',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon sx={{ fontSize: 18, color: 'primary.main' }} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
        {valueEl || <Typography fontWeight={600}>{value || '—'}</Typography>}
      </Box>
    </Box>
  )
}

// ─── Comment bubble ───────────────────────────────────────────────────────────
function CommentBubble({ comment, isOwn }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', mb: 2 }}>
      {!isOwn && (
        <Avatar sx={{ width: 34, height: 34, mr: 1.5, bgcolor: 'primary.main', fontSize: 13 }}>
          {comment.authorName?.[0]?.toUpperCase()}
        </Avatar>
      )}
      <Box sx={{ maxWidth: '72%' }}>
        {!isOwn && (
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5 }}>
            {comment.authorName}
          </Typography>
        )}
        <Paper elevation={0} sx={{
          p: 1.5,
          bgcolor: isOwn ? 'primary.main' : 'grey.100',
          color: isOwn ? '#fff' : 'text.primary',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
          mt: 0.25
        }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </Typography>
        </Paper>
        <Typography variant="caption" color="text.secondary" sx={{
          display: 'block', textAlign: isOwn ? 'right' : 'left', mt: 0.5, mx: 0.5
        }}>
          {formatDateTime(comment.createdAt)}
        </Typography>
      </Box>
      {isOwn && (
        <Avatar sx={{ width: 34, height: 34, ml: 1.5, bgcolor: 'secondary.main', fontSize: 13 }}>
          {comment.authorName?.[0]?.toUpperCase()}
        </Avatar>
      )}
    </Box>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ticket,      setTicket]      = useState(null)
  const [comments,    setComments]    = useState([])
  const [loadingT,    setLoadingT]    = useState(true)
  const [loadingC,    setLoadingC]    = useState(true)
  const [newComment,  setNewComment]  = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  useEffect(() => {
    getTicketById(id)
      .then(r => setTicket(r.data))
      .catch(() => { toast.error('Ticket not found'); navigate('/tickets/my') })
      .finally(() => setLoadingT(false))

    getComments(id)
      .then(r => setComments(r.data))
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }, [id])

  const handleAddComment = async () => {
    const content = newComment.trim()
    if (!content) return
    setSubmitting(true)
    try {
      const res = await addComment(id, { content })
      setComments(prev => [...prev, res.data])
      setNewComment('')
    } catch (err) {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingT) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton height={300} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton height={200} sx={{ borderRadius: 3 }} />
      </Container>
    )
  }

  if (!ticket) return null

  const sm = STATUS_META[ticket.status]   || STATUS_META.OPEN
  const pm = PRIORITY_META[ticket.priority] || PRIORITY_META.MEDIUM
  const grad = PRIORITY_GRADIENT[ticket.priority] || PRIORITY_GRADIENT.MEDIUM

  return (
    <Box sx={{ background: '#F8FAFC', minHeight: '100vh' }}>
      {/* Hero */}
      <Box sx={{ background: grad, py: 5, color: '#fff' }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ color: 'rgba(255,255,255,.7)', mb: 2 }}>
            <Link underline="hover" sx={{ color: 'rgba(255,255,255,.7)', cursor: 'pointer' }}
                  onClick={() => navigate('/tickets/my')}>
              My Tickets
            </Link>
            <Typography sx={{ color: '#fff' }}>#{ticket.id}</Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" fontWeight={900} gutterBottom sx={{ lineHeight: 1.2 }}>
                {ticket.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip label={`#${ticket.id}`} sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} />
                <Chip label={sm.label} color={sm.color} sx={{ fontWeight: 700 }} />
                <Chip label={pm.label} sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} />
              </Box>
            </Box>
            <Button variant="outlined" startIcon={<ArrowBack />}
                    onClick={() => navigate('/tickets/my')}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)',
                          '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,.1)' } }}>
              Back
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left: description + comments */}
          <Grid item xs={12} md={8}>

            {/* Description */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Description</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {ticket.description}
                </Typography>
              </CardContent>
            </Card>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Attachments ({ticket.attachments.length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {ticket.attachments.map(att => (
                      <Grid item xs={6} sm={4} key={att.id}>
                        <Box
                          sx={{
                            position: 'relative', borderRadius: 2, overflow: 'hidden',
                            cursor: 'pointer', '&:hover .overlay': { opacity: 1 }
                          }}
                          onClick={() => setLightboxSrc(att.fileUrl)}
                        >
                          <Box
                            component="img"
                            src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'}${att.fileUrl}`}
                            sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.style.display = 'none' }}
                          />
                          <Box className="overlay" sx={{
                            position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0, transition: 'opacity .2s'
                          }}>
                            <OpenInNew sx={{ color: '#fff', fontSize: 28 }} />
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary" noWrap
                                    sx={{ display: 'block', mt: 0.5 }}>
                          {att.fileName}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Discussion ({comments.length})
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {loadingC ? (
                  [...Array(2)].map((_, i) => <Skeleton key={i} height={64} sx={{ mb: 1, borderRadius: 2 }} />)
                ) : comments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography variant="body2">No comments yet. Be the first to add one!</Typography>
                  </Box>
                ) : (
                  <Box sx={{ mb: 3 }}>
                    {comments.map(c => (
                      <CommentBubble key={c.id} comment={c} isOwn={c.authorId === user?.id} />
                    ))}
                  </Box>
                )}

                {/* Add comment */}
                {ticket.status !== 'CLOSED' && (
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', mt: 2 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 13, flexShrink: 0 }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={5}
                      placeholder="Add a comment…"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.ctrlKey) handleAddComment()
                      }}
                      size="small"
                    />
                    <IconButton
                      color="primary"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submitting}
                      sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: 2,
                            '&:hover': { bgcolor: 'primary.dark' },
                            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}
                    >
                      {submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right: info panel */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, position: 'sticky', top: 80 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Ticket Info</Typography>
                <Divider sx={{ mb: 1 }} />

                <InfoRow icon={Person}   label="Reported by" value={ticket.reporterName} />
                <Divider />
                <InfoRow icon={Person}   label="Assignee"    value={ticket.assigneeName || 'Unassigned'} />
                <Divider />
                <InfoRow icon={Category} label="Category"    value={ticket.category || '—'} />
                <Divider />
                <InfoRow
                  icon={PriorityHigh}
                  label="Priority"
                  valueEl={
                    <Chip label={pm.label} color={pm.color} size="small" sx={{ mt: 0.25, fontWeight: 700 }} />
                  }
                />
                <Divider />
                <InfoRow
                  icon={Schedule}
                  label="Status"
                  valueEl={
                    <Chip label={sm.label} color={sm.color} size="small" variant="outlined"
                          sx={{ mt: 0.25, fontWeight: 700 }} />
                  }
                />
                <Divider />
                <InfoRow icon={Schedule} label="Created"  value={formatDateTime(ticket.createdAt)} />
                <Divider />
                <InfoRow icon={Schedule} label="Updated"  value={formatDateTime(ticket.updatedAt)} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Lightbox */}
      {lightboxSrc && (
        <Box
          sx={{
            position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, cursor: 'zoom-out'
          }}
          onClick={() => setLightboxSrc(null)}
        >
          <Box
            component="img"
            src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'}${lightboxSrc}`}
            sx={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 2, boxShadow: 10 }}
            onClick={e => e.stopPropagation()}
          />
        </Box>
      )}
    </Box>
  )
}
