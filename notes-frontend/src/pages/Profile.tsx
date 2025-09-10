import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  PhotoCamera as PhotoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';


const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // const updatedUser = await api.put('/profile', formData, user?.token);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not authorized. Please log in again.");
        setLoading(false);
        return;
      }
      const updatedUser = await api.put('/profile', formData, token);
      updateUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not authorized. Please log in again.");
        setLoading(false);
        return;
      }

      await api.put('/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, token);
      
      setSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Please log in to view your profile</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default', 
      py: { xs: 2, md: 4 },
      px: { xs: 2, sm: 3 }
    }}>
      <Box maxWidth={800} mx="auto">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 1,
            fontSize: { xs: '1.75rem', md: '2.125rem' }
          }}>
            Your Account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your profile and account settings
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Card */}
          {/* <Grid xs={12} md={8}> */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Profile Information
                  </Typography>
                  {!isEditing ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditing(true)}
                      variant="outlined"
                      size="small"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        startIcon={<SaveIcon />}
                        onClick={handleProfileUpdate}
                        variant="contained"
                        size="small"
                        disabled={loading}
                      >
                        Save
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            displayName: user.displayName || '',
                            bio: user.bio || '',
                            profilePicture: user.profilePicture || ''
                          });
                        }}
                        variant="outlined"
                        size="small"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={3}>
                  {/* Profile Picture */}
                  {/* <Grid xs={12} sm={4}> */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                          src={formData.profilePicture || user.profilePicture}
                          sx={{ 
                            width: 120, 
                            height: 120, 
                            fontSize: '3rem',
                            bgcolor: 'primary.main'
                          }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        {isEditing && (
                          <Tooltip title="Change photo">
                            <IconButton
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                              }}
                              size="small"
                            >
                              <PhotoIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      {isEditing && (
                        <TextField
                          label="Profile Picture URL"
                          value={formData.profilePicture}
                          onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                          size="small"
                          fullWidth
                          sx={{ mt: 2 }}
                          placeholder="https://example.com/photo.jpg"
                        />
                      )}
                    </Box>
                  </Grid>

                  {/* Profile Details */}
                  {/* <Grid size={{xs={12},sm={8}}} xs={12} sm={8}>  */}
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Stack spacing={2}>
                      {/* Username (Read-only) */}
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Username
                        </Typography>
                        <TextField
                          value={user.username}
                          fullWidth
                          disabled
                          size="small"
                          InputProps={{
                            startAdornment: <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} />
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Username cannot be changed for data integrity
                        </Typography>
                      </Box>

                      {/* Email (Read-only) */}
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Email
                        </Typography>
                        <TextField
                          value={user.email}
                          fullWidth
                          disabled
                          size="small"
                          InputProps={{
                            startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />
                          }}
                        />
                      </Box>

                      {/* Display Name */}
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Display Name
                        </Typography>
                        <TextField
                          value={isEditing ? formData.displayName : (user.displayName || 'Not set')}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          fullWidth
                          disabled={!isEditing}
                          size="small"
                          placeholder="Enter your display name"
                        />
                      </Box>

                      {/* Bio */}
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Bio
                        </Typography>
                        <TextField
                          value={isEditing ? formData.bio : (user.bio || 'No bio added')}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          fullWidth
                          disabled={!isEditing}
                          size="small"
                          multiline
                          rows={3}
                          placeholder="Tell us about yourself..."
                        />
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Info Card */}
          {/* <Grid xs={12} md={4}> */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              {/* Account Information */}
              <Card>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Account Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Member since
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last updated
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(user.updatedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Security
                  </Typography>
                  <Button
                    startIcon={<LockIcon />}
                    onClick={() => setIsChangingPassword(true)}
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Change Password
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outlined"
                    color="error"
                    fullWidth
                  >
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Change Password Dialog */}
      <Dialog 
        open={isChangingPassword} 
        onClose={() => setIsChangingPassword(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    edge="end"
                  >
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    edge="end"
                  >
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    edge="end"
                  >
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsChangingPassword(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained" 
            disabled={loading}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
