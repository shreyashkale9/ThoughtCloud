import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Box, Typography } from '@mui/material';

/**
 * Register page for new users.
 */
const Register: React.FC = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await api.post('/auth/register', { username, email, password });
    if (res.message === 'User registered successfully') {
      // Auto-login after registration
      const loginRes = await api.post('/auth/login', { email, password });
      if (loginRes.token) {
        setToken(loginRes.token);
        navigate('/dashboard');
      } else {
        setError(loginRes.message || 'Registration succeeded, but login failed');
      }
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} px={{ xs: 2, sm: 3 }}>
      <Typography variant="h5" mb={2}>Register</Typography>
      <form onSubmit={handleRegister}>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth 
          sx={{ 
            mt: 2,
            py: { xs: 1.5, md: 2 },
            fontSize: { xs: '1rem', md: '1.1rem' },
            minHeight: { xs: '48px', md: '56px' }
          }}
        >
          Register
        </Button>
      </form>
      <Button 
        onClick={() => navigate('/login')} 
        sx={{ 
          mt: 2,
          fontSize: { xs: '0.875rem', md: '1rem' }
        }}
      >
        Already have an account? Login
      </Button>
    </Box>
  );
};

export default Register;