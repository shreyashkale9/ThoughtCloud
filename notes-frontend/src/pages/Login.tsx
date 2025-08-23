import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Box, Typography } from '@mui/material';

/**
 * Login page for user authentication.
 */
const Login: React.FC = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.token) {
        setToken(res.token);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} px={{ xs: 2, sm: 3 }}>
      <Typography variant="h5" mb={2}>Login</Typography>
      <form onSubmit={handleLogin}>
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
          Login
        </Button>
      </form>
      <Button 
        onClick={() => navigate('/register')} 
        sx={{ 
          mt: 2,
          fontSize: { xs: '0.875rem', md: '1rem' }
        }}
      >
        Don't have an account? Register
      </Button>
    </Box>
  );
};

export default Login;