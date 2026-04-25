import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, Container, Typography, TextField,
  Button, Chip, Pagination, CircularProgress, InputAdornment, IconButton,
  Tooltip, Divider, Avatar, Stack, ToggleButtonGroup, ToggleButton,
  Slider, Select, FormControl, InputLabel, MenuItem, Paper, Skeleton,
  Breadcrumbs, Drawer, useMediaQuery, useTheme, Fade,
} from '@mui/material'
import SearchIcon      from '@mui/icons-material/Search'
import ClearIcon       from '@mui/icons-material/Clear'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import ScienceIcon     from '@mui/icons-material/Science'
import DevicesIcon     from '@mui/icons-material/Devices'
import SchoolIcon      from '@mui/icons-material/School'
import GridViewIcon    from '@mui/icons-material/GridView'
import ViewListIcon    from '@mui/icons-material/ViewList'
import FilterListIcon  from '@mui/icons-material/FilterList'
import LocationOnIcon  from '@mui/icons-material/LocationOn'
import PeopleIcon      from '@mui/icons-material/People'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import HomeIcon        from '@mui/icons-material/Home'
import TuneIcon        from '@mui/icons-material/Tune'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { searchResources } from '../../api/resourceApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  LECTURE_HALL: { label: 'Lecture Hall',  icon: <SchoolIcon />,      color: '#1565C0', bg: '#E3F2FD' },
  LAB:          { label: 'Lab',           icon: <ScienceIcon />,     color: '#2E7D32', bg: '#E8F5E9' },
  MEETING_ROOM: { label: 'Meeting Room',  icon: <MeetingRoomIcon />, color: '#E65100', bg: '#FFF3E0' },
  EQUIPMENT:    { label: 'Equipment',     icon: <DevicesIcon />,     color: '#6A1B9A', bg: '#F3E5F5' },
}
const STATUS_STYLES = {
  ACTIVE:            { label: 'Active',            bg: '#E8F5E9', color: '#2E7D32' },
  OUT_OF_SERVICE:    { label: 'Out of Service',    bg: '#FFEBEE', color: '#C62828' },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', bg: '#FFF8E1', color: '#F57F17' },
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────
const FilterPanel = ({ filters, onChange, onClear, total }) => {
  const activeCount = [filters.type, filters.status !== 'ACTIVE' ? filters.status : '', filters.location, filters.minCapacity > 0 ? filters.minCapacity : '']
    .filter(Boolean).length

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Filters
          {activeCount > 0 && (
            <Chip label={activeCount} size="small" color="primary" sx={{ ml: 1 }} />
          )}
        </Typography>
        {activeCount > 0 && (
          <Button size="small" onClick={onClear} sx={{ textTransform: 'none' }}>Clear all</Button>
        )}
      </Box>

      {/* Type */}
      <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={1} textTransform="uppercase">
        Resource Type
      </Typography>
      <Stack spacing={1} mt={1} mb={3}>
        {[{ value: '', label: 'All Types' }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))].map(opt => (
          <Box key={opt.value}
            onClick={() => onChange('type', opt.value)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
              borderRadius: 2, cursor: 'pointer', border: '1.5px solid',
              borderColor: filters.type === opt.value ? 'primary.main' : 'divider',
              bgcolor: filters.type === opt.value ? 'primary.50' : 'background.paper',
              transition: 'all .15s',
              '&:hover': { borderColor: 'primary.light', bgcolor: 'grey.50' },
            }}>
            {opt.value && (
              <Avatar sx={{ width: 28, height: 28, bgcolor: TYPE_CONFIG[opt.value].bg, color: TYPE_CONFIG[opt.value].color }}>
                {TYPE_CONFIG[opt.value].icon}
              </Avatar>
            )}
            <Typography variant="body2" fontWeight={filters.type === opt.value ? 700 : 400}>
              {opt.label}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Status */}
      <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={1} textTransform="uppercase">
        Status
      </Typography>
      <Stack spacing={1} mt={1} mb={3}>
        {[{ value: '', label: 'All', color: '#666' }, ...Object.entries(STATUS_STYLES).map(([k, v]) => ({ value: k, label: v.label, color: v.color }))].map(opt => (
          <Box key={opt.value}
            onClick={() => onChange('status', opt.value)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
              borderRadius: 2, cursor: 'pointer', border: '1.5px solid',
              borderColor: filters.status === opt.value ? opt.color : 'divider',
              transition: 'all .15s',
              '&:hover': { borderColor: opt.color, bgcolor: 'grey.50' },
            }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: opt.color }} />
            <Typography variant="body2" fontWeight={filters.status === opt.value ? 700 : 400}>
              {opt.label}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Min Capacity */}
      <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={1} textTransform="uppercase">
        Min Capacity: {filters.minCapacity || 0}
      </Typography>
      <Slider
        value={filters.minCapacity || 0}
        onChange={(_, v) => onChange('minCapacity', v || '')}
        min={0} max={300} step={10}
        marks={[{ value: 0, label: '0' }, { value: 150, label: '150' }, { value: 300, label: '300' }]}
        sx={{ mt: 3, mb: 1 }}
      />

      <Divider sx={{ my: 2 }} />

      {/* Location */}
      <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={1} textTransform="uppercase">
        Location
      </Typography>
      <TextField
        fullWidth size="small" placeholder="Building, floor…"
        value={filters.location} sx={{ mt: 1 }}
        onChange={e => onChange('location', e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" color="action" /></InputAdornment>,
          endAdornment: filters.location ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onChange('location', '')}><ClearIcon fontSize="small" /></IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
    </Box>
  )
}

// ─── Resource Card (Grid) ─────────────────────────────────────────────────────
const ResourceCardGrid = ({ resource, onClick }) => {
  const tc = TYPE_CONFIG[resource.type] || {}
  const ss = STATUS_STYLES[resource.status] || {}
  return (
    <Card sx={{
      height: '100%', borderRadius: 3, cursor: 'pointer',
      transition: 'all .25s', border: '1.5px solid transparent',
      '&:hover': { transform: 'translateY(-6px)', boxShadow: 8, borderColor: tc.color },
    }} onClick={onClick}>
      {/* Color stripe by type */}
      <Box sx={{ height: 5, bgcolor: tc.color }} />
      {/* Icon header */}
      <Box sx={{ bgcolor: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: tc.color + '22', color: tc.color }}>
          {tc.icon}
        </Avatar>
      </Box>
      <CardContent sx={{ pt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, pr: 1 }} noWrap>
            {resource.name}
          </Typography>
          <Chip label={ss.label} size="small"
            sx={{ bgcolor: ss.bg, color: ss.color, fontWeight: 700, fontSize: 10, flexShrink: 0 }} />
        </Box>

        <Chip label={tc.label} size="small" variant="outlined"
          sx={{ borderColor: tc.color, color: tc.color, mb: 1.5, fontSize: 10 }} />

        <Stack spacing={0.5}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {resource.location}{resource.building ? ` · ${resource.building}` : ''}
            </Typography>
          </Box>
          {resource.capacity && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Capacity: {resource.capacity}
              </Typography>
            </Box>
          )}
        </Stack>

        {resource.features && (
          <Box mt={1.5} display="flex" flexWrap="wrap" gap={0.5}>
            {resource.features.split(',').slice(0, 3).map(f => (
              <Chip key={f} label={f.trim()} size="small"
                sx={{ fontSize: 9, height: 18, bgcolor: 'grey.100' }} />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Resource Row (List view) ─────────────────────────────────────────────────
const ResourceCardList = ({ resource, onClick }) => {
  const tc = TYPE_CONFIG[resource.type] || {}
  const ss = STATUS_STYLES[resource.status] || {}
  return (
    <Card sx={{
      borderRadius: 3, cursor: 'pointer', transition: 'all .2s',
      '&:hover': { boxShadow: 4, borderColor: tc.color },
      border: '1.5px solid', borderColor: 'divider',
    }} onClick={onClick}>
      <CardContent>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ width: 48, height: 48, bgcolor: tc.bg, color: tc.color }}>{tc.icon}</Avatar>
          </Grid>
          <Grid item xs>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight={700}>{resource.name}</Typography>
              <Chip label={tc.label} size="small" sx={{ borderColor: tc.color, color: tc.color }} variant="outlined" />
              <Chip label={ss.label} size="small" sx={{ bgcolor: ss.bg, color: ss.color, fontWeight: 700 }} />
            </Box>
            <Box display="flex" gap={3} mt={0.5} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {resource.location}{resource.building ? ` · ${resource.building}` : ''}
                </Typography>
              </Box>
              {resource.capacity && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Capacity: {resource.capacity}</Typography>
                </Box>
              )}
            </Box>
          </Grid>
          <Grid item>
            <Button variant="outlined" size="small" startIcon={<BookmarkAddIcon />}
              sx={{ borderRadius: 2 }}>
              Book
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const ResourceSkeleton = ({ view }) => (
  <Grid container spacing={3}>
    {Array.from({ length: 6 }).map((_, i) => (
      <Grid item xs={12} sm={view === 'grid' ? 6 : 12} md={view === 'grid' ? 4 : 12} key={i}>
        <Card sx={{ borderRadius: 3 }}>
          <Skeleton variant="rectangular" height={view === 'grid' ? 100 : 80} />
          <CardContent>
            <Skeleton width="70%" height={24} />
            <Skeleton width="40%" height={18} sx={{ mt: 1 }} />
            <Skeleton width="60%" height={18} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
)

// ─── Main Page ────────────────────────────────────────────────────────────────
const ResourceListPage = () => {
  const navigate            = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn }      = useAuth()
  const theme               = useTheme()
  const isMobile            = useMediaQuery(theme.breakpoints.down('md'))

  const [resources,  setResources]  = useState([])
  const [loading,    setLoading]    = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [view,       setView]       = useState('grid')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const debounceRef = useRef(null)

  const [filters, setFilters] = useState({
    keyword:     searchParams.get('keyword') || '',
    type:        searchParams.get('type')    || '',
    status:      searchParams.get('status')  || 'ACTIVE',
    location:    '',
    minCapacity: 0,
    page:        0,
    size:        12,
  })

  const fetchResources = useCallback(async (f) => {
    setLoading(true)
    try {
      const params = { page: f.page, size: f.size }
      if (f.keyword)              params.keyword     = f.keyword
      if (f.type)                 params.type        = f.type
      if (f.status)               params.status      = f.status
      if (f.location)             params.location    = f.location
      if (f.minCapacity > 0)      params.minCapacity = f.minCapacity
      const res = await searchResources(params)
      setResources(res.data.content || [])
      setTotalPages(res.data.totalPages || 1)
      setTotalItems(res.data.totalElements || 0)
    } catch {
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResources(filters), 300)
    return () => clearTimeout(debounceRef.current)
  }, [filters, fetchResources])

  const onChange = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }))

  const onClear = () =>
    setFilters({ keyword: '', type: '', status: 'ACTIVE', location: '', minCapacity: 0, page: 0, size: 12 })

  const SIDEBAR_WIDTH = 260

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 2, px: 3 }}>
        <Container maxWidth="xl">
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
            <Box display="flex" alignItems="center" gap={0.5} component={Link} to="/"
              sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
              <HomeIcon fontSize="small" />
              <Typography variant="body2">Home</Typography>
            </Box>
            <Typography variant="body2" color="text.primary" fontWeight={600}>Resources</Typography>
          </Breadcrumbs>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={800} color="primary">Facilities & Assets</Typography>
              <Typography variant="body2" color="text.secondary">
                {totalItems > 0 ? `${totalItems} resource${totalItems !== 1 ? 's' : ''} found` : 'Browse all bookable campus resources'}
              </Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              {isMobile && (
                <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setDrawerOpen(true)} size="small">
                  Filters
                </Button>
              )}
              <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
                <ToggleButton value="grid"><GridViewIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* ── Search bar ──────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth placeholder="Search by name, description, features, location…"
            value={filters.keyword}
            onChange={e => onChange('keyword', e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment>,
              endAdornment: filters.keyword ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => onChange('keyword', '')}><ClearIcon /></IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 3, bgcolor: 'grey.50' },
            }}
          />
        </Paper>

        <Grid container spacing={3}>
          {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
          {!isMobile && (
            <Grid item md={3} lg={2.5}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 80 }}>
                <FilterPanel filters={filters} onChange={onChange} onClear={onClear} total={totalItems} />
              </Paper>
            </Grid>
          )}

          {/* ── Resource grid/list ────────────────────────────────────────── */}
          <Grid item xs={12} md={9} lg={9.5}>
            {/* Active filter chips */}
            {(filters.type || filters.status !== 'ACTIVE' || filters.location || filters.minCapacity > 0) && (
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {filters.type && (
                  <Chip label={TYPE_CONFIG[filters.type]?.label} onDelete={() => onChange('type', '')} color="primary" size="small" />
                )}
                {filters.status && filters.status !== 'ACTIVE' && (
                  <Chip label={filters.status.replace(/_/g, ' ')} onDelete={() => onChange('status', '')} size="small" />
                )}
                {filters.location && (
                  <Chip label={`Location: ${filters.location}`} onDelete={() => onChange('location', '')} size="small" />
                )}
                {filters.minCapacity > 0 && (
                  <Chip label={`Min cap: ${filters.minCapacity}`} onDelete={() => onChange('minCapacity', 0)} size="small" />
                )}
              </Box>
            )}

            {loading ? (
              <ResourceSkeleton view={view} />
            ) : resources.length === 0 ? (
              <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>No resources found</Typography>
                <Typography color="text.secondary" mb={3}>Try adjusting your filters or search term.</Typography>
                <Button variant="contained" onClick={onClear} startIcon={<FilterListIcon />}>Clear Filters</Button>
              </Paper>
            ) : (
              <Fade in>
                <Box>
                  <Grid container spacing={view === 'grid' ? 3 : 2}>
                    {resources.map(r => (
                      <Grid item xs={12} sm={view === 'grid' ? 6 : 12} md={view === 'grid' ? 4 : 12} key={r.id}>
                        {view === 'grid'
                          ? <ResourceCardGrid resource={r} onClick={() => navigate(`/resources/${r.id}`)} />
                          : <ResourceCardList resource={r} onClick={() => navigate(`/resources/${r.id}`)} />
                        }
                      </Grid>
                    ))}
                  </Grid>

                  {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" mt={4}>
                      <Pagination
                        count={totalPages}
                        page={filters.page + 1}
                        onChange={(_, p) => setFilters(prev => ({ ...prev, page: p - 1 }))}
                        color="primary" size="large" showFirstButton showLastButton
                      />
                    </Box>
                  )}
                </Box>
              </Fade>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* ── Mobile filter drawer ──────────────────────────────────────────── */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 300, p: 3 } }}>
        <Typography variant="h6" fontWeight={700} mb={2}>Filters</Typography>
        <FilterPanel filters={filters} onChange={onChange} onClear={onClear} total={totalItems} />
      </Drawer>
    </Box>
  )
}

export default ResourceListPage
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, Container, Drawer, List, ListItemButton,
  Typography, TextField, Button, Chip, Pagination, CircularProgress,
  InputAdornment, IconButton, Tooltip, Divider, Avatar, Stack,
  ToggleButtonGroup, ToggleButton, Slider, Select, FormControl,
  InputLabel, MenuItem, Badge, Breadcrumbs, Paper, Skeleton,
} from '@mui/material'
import SearchIcon       from '@mui/icons-material/Search'
import ClearIcon        from '@mui/icons-material/Clear'
import MeetingRoomIcon  from '@mui/icons-material/MeetingRoom'
import ScienceIcon      from '@mui/icons-material/Science'
import DevicesIcon      from '@mui/icons-material/Devices'
import SchoolIcon       from '@mui/icons-material/School'
import GridViewIcon     from '@mui/icons-material/GridView'
import ViewListIcon     from '@mui/icons-material/ViewList'
import FilterListIcon   from '@mui/icons-material/FilterList'
import LocationOnIcon   from '@mui/icons-material/LocationOn'
import PeopleIcon       from '@mui/icons-material/People'
import BookmarkAddIcon  from '@mui/icons-material/BookmarkAdd'
import HomeIcon         from '@mui/icons-material/Home'
import TuneIcon         from '@mui/icons-material/Tune'
import { searchResources } from '../../api/resourceApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  LECTURE_HALL: { label: 'Lecture Hall',  icon: <SchoolIcon />,      color: '#1565C0', bg: '#E3F2FD' },
  LAB:          { label: 'Lab',           icon: <ScienceIcon />,     color: '#2E7D32', bg: '#E8F5E9' },
  MEETING_ROOM: { label: 'Meeting Room',  icon: <MeetingRoomIcon />, color: '#E65100', bg: '#FFF3E0' },
  EQUIPMENT:    { label: 'Equipment',     icon: <DevicesIcon />,     color: '#6A1B9A', bg: '#F3E5F5' },
}

const STATUS_STYLES = {
  ACTIVE:            { label: 'Active',            bg: '#E8F5E9', color: '#2E7D32' },
  OUT_OF_SERVICE:    { label: 'Out of Service',    bg: '#FFEBEE', color: '#C62828' },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', bg: '#FFF8E1', color: '#F57F17' },
}

const TYPE_OPTIONS = [
  { value: '',              label: 'All Types' },
  { value: 'LECTURE_HALL',  label: 'Lecture Hall' },
  { value: 'LAB',           label: 'Lab' },
  { value: 'MEETING_ROOM',  label: 'Meeting Room' },
  { value: 'EQUIPMENT',     label: 'Equipment' },
]

const STATUS_OPTIONS = [
  { value: '',                  label: 'All Statuses' },
  { value: 'ACTIVE',            label: 'Active' },
  { value: 'OUT_OF_SERVICE',    label: 'Out of Service' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
]

const STATUS_COLOR = {
  ACTIVE:            'success',
  OUT_OF_SERVICE:    'error',
  UNDER_MAINTENANCE: 'warning',
}

const TYPE_ICON = {
  LECTURE_HALL: <SchoolIcon />,
  LAB:          <ScienceIcon />,
  MEETING_ROOM: <MeetingRoomIcon />,
  EQUIPMENT:    <VideocamIcon />,
}

const ResourceListPage = () => {
  const navigate = useNavigate()

  const [resources,   setResources]   = useState([])
  const [loading,     setLoading]     = useState(false)
  const [totalPages,  setTotalPages]  = useState(1)
  const [totalItems,  setTotalItems]  = useState(0)

  const [filters, setFilters] = useState({
    keyword: '', type: '', status: 'ACTIVE',
    location: '', minCapacity: '', page: 0, size: 12,
  })

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.keyword)     params.keyword     = filters.keyword
      if (filters.type)        params.type        = filters.type
      if (filters.status)      params.status      = filters.status
      if (filters.location)    params.location    = filters.location
      if (filters.minCapacity) params.minCapacity = filters.minCapacity
      params.page = filters.page
      params.size = filters.size

      const res = await searchResources(params)
      setResources(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalItems(res.data.totalElements)
    } catch {
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchResources() }, [fetchResources])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }))
  }

  const handleClearFilters = () => {
    setFilters({ keyword: '', type: '', status: 'ACTIVE', location: '', minCapacity: '', page: 0, size: 12 })
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Page Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} color="primary">
          Facilities & Assets
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse and search all bookable campus resources
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small" placeholder="Search by name, description, features…"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
                ),
                endAdornment: filters.keyword && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleFilterChange('keyword', '')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={filters.type} label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}>
                {TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filters.status} label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField fullWidth size="small" label="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)} />
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField fullWidth size="small" label="Min Cap." type="number"
              value={filters.minCapacity}
              onChange={(e) => handleFilterChange('minCapacity', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={1}>
            <Tooltip title="Clear filters">
              <Button variant="outlined" size="small" fullWidth onClick={handleClearFilters}>
                Clear
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Card>

      {/* Results count */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading…' : `${totalItems} resource${totalItems !== 1 ? 's' : ''} found`}
        </Typography>
      </Box>

      {/* Resource Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : resources.length === 0 ? (
        <Box textAlign="center" mt={8}>
          <Typography variant="h6" color="text.secondary">No resources found</Typography>
          <Button sx={{ mt: 2 }} onClick={handleClearFilters}>Clear filters</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {resources.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column',
                          transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardActionArea onClick={() => navigate(`/resources/${r.id}`)} sx={{ flex: 1 }}>
                  {r.imageUrl ? (
                    <CardMedia component="img" height="160" image={r.imageUrl} alt={r.name} />
                  ) : (
                    <Box height={160} display="flex" alignItems="center" justifyContent="center"
                         bgcolor="primary.50" color="primary.main" fontSize={64}>
                      {TYPE_ICON[r.type]}
                    </Box>
                  )}
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" fontWeight={600} noWrap sx={{ flex: 1 }}>
                        {r.name}
                      </Typography>
                      <Chip
                        label={r.status.replace(/_/g, ' ')}
                        color={STATUS_COLOR[r.status]}
                        size="small"
                        sx={{ ml: 1, flexShrink: 0 }}
                      />
                    </Box>

                    <Chip
                      icon={TYPE_ICON[r.type]}
                      label={r.type.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />

                    <Typography variant="body2" color="text.secondary">
                      📍 {r.location}{r.building ? ` · ${r.building}` : ''}
                    </Typography>
                    {r.capacity && (
                      <Typography variant="body2" color="text.secondary">
                        👥 Capacity: {r.capacity}
                      </Typography>
                    )}
                    {r.description && (
                      <Typography variant="body2" color="text.secondary"
                        sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {r.description}
                      </Typography>
                    )}
                    {r.features && (
                      <Box mt={1} display="flex" flexWrap="wrap" gap={0.5}>
                        {r.features.split(',').slice(0, 3).map((f) => (
                          <Chip key={f} label={f.trim()} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={filters.page + 1}
            onChange={(_, v) => setFilters((p) => ({ ...p, page: v - 1 }))}
            color="primary"
          />
        </Box>
      )}
    </Box>
  )
}

export default ResourceListPage
