import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  TextField, 
  Button, 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Card,
  CardContent,
  CardActions,
  Fab,
  Tooltip,
  useTheme,
  Grid,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import CanvasDraw from 'react-canvas-draw';
import DrawingCanvas from '../components/DrawingCanvas';

/**
 * Drawing interface for type safety
 */
interface Drawing {
  _id: string;
  title: string;
  description: string;
  canvasData: string;
  width: number;
  height: number;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Drawings page: displays, creates, edits, deletes, and searches drawings
 */
const Drawings: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const theme = useTheme();
  
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewDrawing, setViewDrawing] = useState<Drawing | null>(null);
  const [deleteDrawingId, setDeleteDrawingId] = useState<string | null>(null);
  const [drawingDialogOpen, setDrawingDialogOpen] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState<Drawing | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDrawings, setTotalDrawings] = useState(0);

  /**
   * Fetch drawings from the backend with pagination and filters
   */
  const fetchDrawings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '12');
      if (search) params.append('search', search);
      if (selectedTag) params.append('tags', selectedTag);
      
      const data = await api.get(`/drawings?${params.toString()}`, token ?? undefined);
      setDrawings(data.drawings || []);
      setTotalPages(data.totalPages || 1);
      setTotalDrawings(data.total || 0);
    } catch (error) {
      console.error('Error fetching drawings:', error);
      setDrawings([]);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        setError('Please log in to view your drawings');
      }
    }
  }, [token, currentPage, search, selectedTag]);

  /**
   * Fetch available tags
   */
  const fetchTags = useCallback(async () => {
    try {
      const tags = await api.get('/drawings/tags/all', token ?? undefined);
      setAvailableTags(Array.isArray(tags) ? tags : []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAvailableTags([]);
    }
  }, [token]);

  /**
   * Handle drawing creation/editing
   */
  const handleDrawingSave = async (data: {
    title: string;
    description: string;
    tags: string[];
    isPublic: boolean;
    canvasData: string;
    width: number;
    height: number;
  }) => {
    setError('');
    try {
      let res: any;
      
      if (editingDrawing) {
        // Editing existing drawing
        res = await api.put(`/drawings/${editingDrawing._id}`, data, token ?? undefined);
        
        if (res._id) {
          setDrawings(drawings.map(drawing => (drawing._id === editingDrawing._id ? res : drawing)));
        }
      } else {
        // Creating new drawing
        res = await api.post('/drawings', data, token ?? undefined);
        
        if (res._id) {
          setDrawings([res, ...drawings]);
          setTotalDrawings(totalDrawings + 1);
        }
      }
      
      if (res._id) {
        setDrawingDialogOpen(false);
        setEditingDrawing(null);
        fetchTags(); // Refresh tags
      } else {
        setError(res.message || `Failed to ${editingDrawing ? 'update' : 'create'} drawing`);
      }
    } catch (error) {
      console.error(`Error ${editingDrawing ? 'updating' : 'creating'} drawing:`, error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(`Failed to ${editingDrawing ? 'update' : 'create'} drawing`);
      }
    }
  };

  // Fetch drawings and tags on mount or when token changes
  useEffect(() => {
    if (token) {
      fetchDrawings();
      fetchTags();
    }
  }, [token, currentPage, search, selectedTag, fetchDrawings, fetchTags]);

  /**
   * Handle drawing deletion
   */
  const handleDelete = async () => {
    if (!deleteDrawingId) return;
    try {
      await api.delete(`/drawings/${deleteDrawingId}`, token ?? undefined);
      setDrawings(drawings.filter(drawing => drawing._id !== deleteDrawingId));
      setTotalDrawings(totalDrawings - 1);
      setDeleteDrawingId(null);
    } catch (error) {
      console.error('Error deleting drawing:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to delete drawing');
      }
    }
  };

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDrawings();
  };

  /**
   * Handle tag filter
   */
  const handleTagFilter = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
    setCurrentPage(1);
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!token) {
    return (
      <Box maxWidth={700} mx="auto" mt={4} textAlign="center">
        <Typography variant="h5" mb={2}>Welcome to ThoughtCloud Drawings</Typography>
        <Typography variant="body1" mb={3}>
          Please log in to view and manage your drawings.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/')}
        >
          Go to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* Error Display */}
      {error && (
        <Box mb={3} p={2} bgcolor="error.light" borderRadius={1} mx={{ xs: 2, sm: 3 }}>
          <Typography color="error.contrastText">{error}</Typography>
        </Box>
      )}

      {/* Header Section */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: 1, 
        borderColor: 'divider',
        px: { xs: 2, sm: 3 },
        py: 3
      }}>
        <Box maxWidth={1200} mx="auto">
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 2,
            fontSize: { xs: '1.75rem', md: '2.125rem' }
          }}>
            🎨 My Drawings
          </Typography>
          
          {/* Search and Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, gap: '8px' }}>
                <TextField
                  placeholder="Search drawings..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                  sx={{ bgcolor: 'background.default' }}
                />
                <Button type="submit" variant="outlined" sx={{ minWidth: 'auto', px: 2 }}>
                  Search
                </Button>
              </form>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => setDrawingDialogOpen(true)}
              startIcon={<AddIcon />}
              sx={{ 
                whiteSpace: 'nowrap',
                px: 3,
                py: 1,
                minHeight: '40px'
              }}
            >
              New Drawing
            </Button>
          </Box>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Filter by tags:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableTags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    clickable
                    variant={selectedTag === tag ? 'filled' : 'outlined'}
                    onClick={() => handleTagFilter(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Drawings Grid */}
      <Box maxWidth={1200} mx="auto" px={{ xs: 2, sm: 3 }} pt={4}>
        {drawings.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" mb={2}>
              No drawings found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {search || selectedTag ? 'Try adjusting your search or filters.' : 'Create your first drawing to get started!'}
            </Typography>
            {!search && !selectedTag && (
              <Button 
                variant="contained" 
                onClick={() => setDrawingDialogOpen(true)}
                startIcon={<AddIcon />}
              >
                Create Your First Drawing
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {drawings.map(drawing => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={drawing._id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                    onClick={() => setViewDrawing(drawing)}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          lineHeight: 1.3,
                          flex: 1
                        }}>
                          {drawing.title}
                        </Typography>
                        {drawing.isPublic ? (
                          <PublicIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.875rem', md: '0.9rem' },
                        lineHeight: 1.4
                      }}>
                        {drawing.description || 'No description'}
                      </Typography>

                      {/* Drawing Preview */}
                      <Box sx={{ 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        overflow: 'hidden',
                        mb: 2,
                        height: '120px',
                        bgcolor: 'background.default'
                      }}>
                        <CanvasDraw
                          brushColor="#000000"
                          brushRadius={1}
                          lazyRadius={0}
                          canvasWidth={200}
                          canvasHeight={120}
                          saveData={drawing.canvasData}
                          disabled={true}
                          style={{
                            border: 'none',
                            borderRadius: '4px',
                            transform: 'scale(0.5)',
                            transformOrigin: 'top left',
                            width: '400px',
                            height: '240px'
                          }}
                        />
                      </Box>

                      {drawing.tags && drawing.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {drawing.tags.slice(0, 3).map(tag => (
                            <Chip 
                              key={tag} 
                              label={tag} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.75rem',
                                height: '20px'
                              }} 
                            />
                          ))}
                          {drawing.tags.length > 3 && (
                            <Chip 
                              label={`+${drawing.tags.length - 3}`} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.75rem',
                                height: '20px'
                              }} 
                            />
                          )}
                        </Box>
                      )}

                      {drawing.updatedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Updated {formatDate(drawing.updatedAt)}
                        </Typography>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ p: 1, pt: 0 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
                        <Tooltip title="View">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewDrawing(drawing);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDrawing(drawing);
                              setDrawingDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDrawingId(drawing._id);
                            }}
                            sx={{ ml: 'auto' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 1 }}>
                <Button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Typography sx={{ alignSelf: 'center', px: 2 }}>
                  Page {currentPage} of {totalPages} ({totalDrawings} drawings)
                </Typography>
                <Button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add drawing"
        onClick={() => setDrawingDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Drawing Canvas Dialog */}
      <DrawingCanvas
        open={drawingDialogOpen}
        onClose={() => {
          setDrawingDialogOpen(false);
          setEditingDrawing(null);
        }}
        onSave={handleDrawingSave}
        initialData={editingDrawing ? {
          title: editingDrawing.title,
          description: editingDrawing.description,
          tags: editingDrawing.tags,
          isPublic: editingDrawing.isPublic,
          canvasData: editingDrawing.canvasData,
          width: editingDrawing.width,
          height: editingDrawing.height
        } : undefined}
      />

      {/* View Drawing Dialog */}
      <Dialog 
        open={!!viewDrawing} 
        onClose={() => setViewDrawing(null)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
            maxHeight: { xs: 'calc(100% - 32px)', sm: '80vh' }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {viewDrawing?.title}
              </Typography>
              {viewDrawing?.isPublic ? (
                <PublicIcon sx={{ fontSize: 20, color: 'success.main' }} />
              ) : (
                <LockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Edit">
                <IconButton 
                  size="small"
                  onClick={() => {
                    if (viewDrawing) {
                      setEditingDrawing(viewDrawing);
                      setDrawingDialogOpen(true);
                      setViewDrawing(null);
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton 
                  size="small"
                  onClick={() => {
                    setDeleteDrawingId(viewDrawing?._id || null);
                    setViewDrawing(null);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {viewDrawing && (
            <>
              {viewDrawing.description && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {viewDrawing.description}
                </Typography>
              )}
              
              {viewDrawing.tags && viewDrawing.tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {viewDrawing.tags.map(tag => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      sx={{ fontSize: '0.75rem' }} 
                    />
                  ))}
                </Box>
              )}
              
              {viewDrawing.updatedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Last updated: {formatDate(viewDrawing.updatedAt)}
                </Typography>
              )}
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1,
                overflow: 'hidden',
                minHeight: '400px',
                bgcolor: 'background.default'
              }}>
                <CanvasDraw
                  brushColor="#000000"
                  brushRadius={2}
                  lazyRadius={0}
                  canvasWidth={600}
                  canvasHeight={400}
                  saveData={viewDrawing.canvasData}
                  disabled={true}
                  style={{
                    border: 'none',
                    borderRadius: '4px'
                  }}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDrawing(null)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (viewDrawing) {
                setEditingDrawing(viewDrawing);
                setDrawingDialogOpen(true);
                setViewDrawing(null);
              }
            }}
          >
            Edit Drawing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!deleteDrawingId} 
        onClose={() => setDeleteDrawingId(null)}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>Delete Drawing</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this drawing?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDrawingId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Drawings;
