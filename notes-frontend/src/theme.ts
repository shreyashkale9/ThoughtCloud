import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: { main: '#1976d2' },
          secondary: { main: '#f50057', light: '#ff5983' },
          background: { default: '#f5f5f5', paper: '#fff' },
        }
      : {
          // palette values for dark mode
          primary: { main: '#90caf9' },
          secondary: { main: '#f48fb1', light: '#ffc1e3' },
          background: { default: '#121212', paper: '#1e1e1e' },
        }),
  },
});

export const getTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));