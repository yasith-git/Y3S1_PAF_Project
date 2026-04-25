import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, IconButton, Badge,
  Menu, MenuItem, Avatar, Box, Divider, ListItemText,
  ListItemIcon, Tooltip, CircularProgress,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon        from '@mui/icons-material/Logout'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DoneAllIcon       from '@mui/icons-material/DoneAll'
import DeleteIcon        from '@mui/icons-material/Delete'
import { useAuth } from '../../context/AuthContext'
import {
  getMyNotifications, getUnreadCount,
  markAsRead, markAllAsRead, deleteNotification,
} from '../../api/notificationApi'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const [notifAnchor,   setNotifAnchor]   = useState(null)
  const [profileAnchor, setProfileAnchor] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loadingNotifs, setLoadingNotifs] = useState(false)

  // Fetch unread count every 30 s when logged in
  useEffect(() => {
    if (!isLoggedIn) return
    const fetchCount = () =>
      getUnreadCount().then((r) => setUnreadCount(r.data.unreadCount)).catch(() => {})
    fetchCount()
    const id = setInterval(fetchCount, 30000)
    return () => clearInterval(id)
  }, [isLoggedIn])

  const handleOpenNotifications = async (e) => {
    setNotifAnchor(e.currentTarget)
    setLoadingNotifs(true)
    try {
      const res = await getMyNotifications()
      setNotifications(res.data)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoadingNotifs(false)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      toast.error('Could not mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      toast.error('Could not delete notification')
    }
  }

  const handleLogout = () => {
    logout()
    setProfileAnchor(null)
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        {/* Logo / Title */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 700 }}
        >
          Smart Campus Hub
        </Typography>

        {/* Nav Links */}
        <Button color="inherit" component={Link} to="/resources">Resources</Button>

        {isLoggedIn && (
          <>
            <Button color="inherit" component={Link} to="/bookings/my">My Bookings</Button>
            <Button color="inherit" component={Link} to="/tickets/my">My Tickets</Button>
          </>
        )}

        {isAdmin && (
          <Button color="inherit" component={Link} to="/admin/resources" startIcon={<AdminPanelSettingsIcon />}>
            Admin
          </Button>
        )}

        {/* Notification Bell */}
        {isLoggedIn && (
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleOpenNotifications}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        {/* User Avatar / Profile */}
        {isLoggedIn ? (
          <>
            <Tooltip title={user?.name || 'Profile'}>
              <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ ml: 1 }}>
                {user?.pictureUrl
                  ? <Avatar src={user.pictureUrl} sx={{ width: 32, height: 32 }} />
                  : <AccountCircleIcon sx={{ color: 'white' }} />}
              </IconButton>
            </Tooltip>

            {/* Profile Menu */}
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={() => setProfileAnchor(null)}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>{user?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                  <Typography variant="caption" display="block" color="primary">{user?.role}</Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button color="inherit" component={Link} to="/login" variant="outlined" sx={{ ml: 1, borderColor: 'white', color: 'white' }}>
            Login
          </Button>
        )}

        {/* Notifications Panel */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
        >
          <Box px={2} py={1} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" startIcon={<DoneAllIcon />} onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </Box>
          <Divider />

          {loadingNotifs ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">No notifications</Typography>
            </MenuItem>
          ) : (
            notifications.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                sx={{ bgcolor: n.read ? 'inherit' : 'action.hover', alignItems: 'flex-start', py: 1.5 }}
              >
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={n.read ? 400 : 700}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(n.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => handleDeleteNotification(n.id, e)}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
