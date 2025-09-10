import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Paper,
  Stack,
  Chip,
  useTheme,
} from '@mui/material';
import {
  NoteAlt as NoteIcon,
  Folder as FolderIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Devices as DevicesIcon,
  Speed as SpeedIcon,
  Cloud as CloudIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const theme = useTheme();

  const features = [
    {
      icon: <NoteIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Rich Text Editing',
      description: 'Create beautiful notes with our powerful rich text editor. Format text, add lists, and organize your thoughts with ease.',
    },
    {
      icon: <FolderIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Smart Organization',
      description: 'Organize your notes with folders and tags. Find what you need quickly with our intuitive categorization system.',
    },
    {
      icon: <SearchIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Advanced Search',
      description: 'Search through your notes by title, content, folder, or tags. Find information instantly with our powerful search.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Secure & Private',
      description: 'Your notes are encrypted and secure. We use industry-standard security to protect your personal information.',
    },
    {
      icon: <DevicesIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Cross-Platform',
      description: 'Access your notes from anywhere. Works seamlessly on desktop, tablet, and mobile devices.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Lightning Fast',
      description: 'Built with modern technology for instant loading and smooth performance. Never wait for your notes to load.',
    },
  ];

  const handleGetStarted = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 6, sm: 8, md: 12 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: { xs: 3, md: 4 }, 
            alignItems: 'center',
            textAlign: { xs: 'center', md: 'left' }
          }}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                  lineHeight: { xs: 1.1, md: 1.2 },
                  textAlign: { xs: 'center', md: 'left' }
                }}
              >
                Organize Your
                <br />
                <Box component="span" sx={{ color: 'secondary.light' }}>
                  Thoughts
                </Box>
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: { xs: 3, md: 4 },
                  opacity: 0.9,
                  fontWeight: 300,
                  lineHeight: { xs: 1.4, md: 1.6 },
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                  textAlign: { xs: 'center', md: 'left' }
                }}
              >
                ThoughtCloud is your personal space for capturing ideas, organizing knowledge, 
                and bringing your thoughts to life. Simple, powerful, and beautiful.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ 
                  mb: { xs: 3, md: 4 },
                  width: '100%',
                  alignItems: { xs: 'stretch', sm: 'center' }
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  sx={{
                    py: { xs: 1.5, md: 2 },
                    px: { xs: 3, md: 4 },
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    fontWeight: 600,
                    bgcolor: 'white',
                    color: 'primary.main',
                    minHeight: { xs: '48px', md: '56px' },
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {token ? 'Go to Dashboard' : 'Get Started Free'}
                  <ArrowForwardIcon sx={{ ml: 1 }} />
                </Button>
                {!token && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      py: { xs: 1.5, md: 2 },
                      px: { xs: 3, md: 4 },
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      fontWeight: 600,
                      borderColor: 'white',
                      color: 'white',
                      minHeight: { xs: '48px', md: '56px' },
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    Sign In
                  </Button>
                )}
              </Stack>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                alignItems={{ xs: 'center', sm: 'center' }}
                sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}
              >
                <Chip
                  label="Free Forever"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                  }}
                />
                <Chip
                  label="No Credit Card Required"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                  }}
                />
              </Stack>
            </Box>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'center',
              width: '100%'
            }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  width: '100%',
                  maxWidth: { xs: '100%', sm: 400 }
                }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    maxWidth: { xs: '100%', sm: 400 },
                    width: '100%',
                    transform: { xs: 'rotate(0deg)', md: 'rotate(3deg)' },
                    '&:hover': {
                      transform: { xs: 'scale(1.02)', md: 'rotate(0deg) scale(1.02)' },
                      transition: 'transform 0.3s ease',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CloudIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" fontWeight={600}>
                      My Notes
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    📝 Meeting Notes - Project Ideas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    📁 Personal - Shopping List
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    🏷️ Work - Task Management
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="ideas" size="small" />
                    <Chip label="work" size="small" />
                    <Chip label="personal" size="small" />
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, sm: 8, md: 12 }, px: { xs: 2, sm: 3 } }}>
        <Box textAlign="center" sx={{ mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: { xs: 1.5, md: 2 },
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              lineHeight: { xs: 1.2, md: 1.3 }
            }}
          >
            Everything You Need
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ 
              maxWidth: 600, 
              mx: 'auto',
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              lineHeight: { xs: 1.4, md: 1.5 }
            }}
          >
            ThoughtCloud combines simplicity with powerful features to help you 
            capture, organize, and find your thoughts instantly.
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
          gap: { xs: 3, md: 4 },
          maxWidth: '100%'
        }}>
          {features.map((feature, index) => (
            <Box key={index}>
              <Card
                sx={{
                  height: '100%',
                  p: { xs: 2, sm: 3 },
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'translateY(-4px)', md: 'translateY(-8px)' },
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ mb: { xs: 1.5, md: 2 } }}>
                    {React.cloneElement(feature.icon, { 
                      sx: { fontSize: { xs: 32, sm: 36, md: 40 }, color: 'primary.main' } 
                    })}
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ 
                      fontWeight: 600, 
                      mb: { xs: 1.5, md: 2 },
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      lineHeight: { xs: 1.4, md: 1.5 }
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 6, sm: 8, md: 12 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="md" sx={{ px: { xs: 0, sm: 2 } }}>
          <Box textAlign="center">
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: { xs: 2, md: 3 },
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                lineHeight: { xs: 1.2, md: 1.3 }
              }}
            >
              Ready to Get Started?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: { xs: 3, md: 4 },
                opacity: 0.9,
                maxWidth: 600,
                mx: 'auto',
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                lineHeight: { xs: 1.4, md: 1.5 }
              }}
            >
              Join thousands of users who are already organizing their thoughts 
              with ThoughtCloud. Start your journey today.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                py: { xs: 1.5, md: 2 },
                px: { xs: 4, md: 6 },
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                fontWeight: 600,
                bgcolor: 'white',
                color: 'primary.main',
                minHeight: { xs: '48px', md: '56px' },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  bgcolor: 'grey.100',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {token ? 'Go to Dashboard' : 'Start Writing Now'}
              <ArrowForwardIcon sx={{ ml: 1 }} />
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          py: { xs: 3, md: 4 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
          <Box textAlign="center">
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.875rem', md: '1rem' },
                lineHeight: 1.5
              }}
            >
              © 2024 ThoughtCloud. Built by Shreyash with ❤️ for better note-taking.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
