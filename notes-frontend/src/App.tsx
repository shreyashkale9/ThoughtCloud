import React, { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '../../notes-frontend/src/components/Navbar';
import ProtectedRoute from '../../notes-frontend/src/components/ProtectedRoute';
import Home from '../../notes-frontend/src/pages/Home';
import Login from '../../notes-frontend/src/pages/Login';
import Register from '../../notes-frontend/src/pages/Register';
import Landing from '../../notes-frontend/src/pages/Landing';
import Profile from '../../notes-frontend/src/pages/Profile';
import Drawings from '../../notes-frontend/src/pages/Drawings';
import HandwrittenNote from '../../notes-frontend/src/pages/HandwrittenNote';

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar mode={mode} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Landing />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/drawings" element={<Drawings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/handwritten/:id" element={<HandwrittenNote />} />
          <Route path="/handwritten/new" element={<HandwrittenNote />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;