import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material'
import Navbar             from './components/layout/Navbar'
import ProtectedRoute     from './components/common/ProtectedRoute'
import AdminRoute         from './components/common/AdminRoute'
import LoginPage          from './pages/auth/LoginPage'
import ResourceListPage   from './pages/resources/ResourceListPage'
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import ResourceManagePage from './pages/admin/ResourceManagePage'
import BookingFormPage    from './pages/bookings/BookingFormPage'
import MyBookingsPage     from './pages/bookings/MyBookingsPage'
import AdminBookingsPage  from './pages/admin/AdminBookingsPage'
import CreateTicketPage   from './pages/tickets/CreateTicketPage'
import MyTicketsPage      from './pages/tickets/MyTicketsPage'
import TicketDetailPage   from './pages/tickets/TicketDetailPage'
import AdminTicketsPage   from './pages/admin/AdminTicketsPage'

// ─── Premium MUI theme ────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary:   { main: '#1565C0', light: '#1976D2', dark: '#0D47A1', contrastText: '#fff' },
    secondary: { main: '#00897B', light: '#26A69A', dark: '#00695C', contrastText: '#fff' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    error:   { main: '#C62828' },
    warning: { main: '#F57F17' },
    success: { main: '#2E7D32' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.01em' },
    h3: { fontWeight: 800, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiCard: {
      styleOverrides: { root: { boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #E2E8F0' } },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableHead: { styleOverrides: { root: { '& .MuiTableCell-head': { fontWeight: 700 } } } },
  },
})

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<ResourceListPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Facilities – Member 1 */}
          <Route path="/resources"     element={<ResourceListPage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/admin/resources" element={<AdminRoute><ResourceManagePage /></AdminRoute>} />

          {/* Bookings – Member 2 */}
          <Route path="/bookings/new" element={<ProtectedRoute><BookingFormPage /></ProtectedRoute>} />
          <Route path="/bookings/my"  element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookingsPage /></AdminRoute>} />

          {/* Tickets – Member 3 */}
          <Route path="/tickets/new"   element={<ProtectedRoute><CreateTicketPage /></ProtectedRoute>} />
          <Route path="/tickets/my"    element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
          <Route path="/tickets/:id"   element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />
          <Route path="/admin/tickets" element={<AdminRoute><AdminTicketsPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
