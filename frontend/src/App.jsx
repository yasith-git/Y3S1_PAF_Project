import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import LoginPage from './pages/auth/LoginPage'

// Pages will be imported per feature branch
const Home = () => <div style={{ padding: 32 }}><h2>Smart Campus Operations Hub</h2></div>

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#0288d1' },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Module A – Resources (feature/member1-facilities) */}
          {/* <Route path="/resources" element={<ResourceListPage />} /> */}
          {/* <Route path="/resources/:id" element={<ResourceDetailPage />} /> */}
          {/* <Route path="/admin/resources" element={<AdminRoute><ResourceManagePage /></AdminRoute>} /> */}

          {/* Module B – Bookings (feature/member2-bookings) */}
          {/* <Route path="/bookings/new" element={<ProtectedRoute><BookingFormPage /></ProtectedRoute>} /> */}
          {/* <Route path="/bookings/my" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} /> */}
          {/* <Route path="/admin/bookings" element={<AdminRoute><AdminBookingsPage /></AdminRoute>} /> */}

          {/* Module C – Tickets (feature/member3-tickets) */}
          {/* <Route path="/tickets/new" element={<ProtectedRoute><CreateTicketPage /></ProtectedRoute>} /> */}
          {/* <Route path="/tickets/my" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} /> */}
          {/* <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} /> */}
          {/* <Route path="/admin/tickets" element={<AdminRoute><AdminTicketsPage /></AdminRoute>} /> */}

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
