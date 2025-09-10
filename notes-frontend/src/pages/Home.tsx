import React, { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
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
  MenuItem, 
  Select, 
  InputLabel, 
  FormControl,
  Card,
  CardContent,
  CardActions,
  Fab,
  Tooltip,
  Divider,
  useTheme,
  Slider,
  Popover,
  Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FolderIcon from '@mui/icons-material/Folder';
import LabelIcon from '@mui/icons-material/Label';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import BrushIcon from '@mui/icons-material/Brush';
import EraserIcon from '@mui/icons-material/FormatColorReset';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ClearIcon from '@mui/icons-material/Clear';

// Lazy load CanvasDraw for better performance
const CanvasDraw = lazy(() => import('react-canvas-draw').then(module => ({ default: module.default })));

/**
 * Note interface for type safety.
 */
interface Note {
  _id: string;
  title: string;
  content: string;
  folder?: string;
  tags?: string[];
  type?: 'text' | 'handwritten';
  drawingData?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Excel-like major colors (7-8 main colors)
const EXCEL_COLORS = [
  '#000000', // Black
  '#FF0000', // Red  
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500'  // Orange
];

/**
 * Custom Color Picker Component
 */
interface ColorPickerProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  type: 'text' | 'background';
}

const ColorPicker: React.FC<ColorPickerProps> = ({ open, anchorEl, onClose, onColorSelect, type }) => {
  const [customColor, setCustomColor] = useState('#000000');

  const handleColorClick = (color: string) => {
    onColorSelect(color);
    onClose();
  };

  const handleCustomColorSubmit = () => {
    if (customColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      onColorSelect(customColor);
      onClose();
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Paper sx={{ p: 2, minWidth: 280 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {type === 'text' ? 'Text Color' : 'Background Color'}
        </Typography>
        
        {/* Excel Colors Grid */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 0.5, 
          mb: 2,
          maxWidth: 280
        }}>
          {EXCEL_COLORS.map((color, index) => (
            <Box
              key={index}
              sx={{
                width: 24,
                height: 24,
                backgroundColor: color,
                border: '1px solid #ccc',
                cursor: 'pointer',
                '&:hover': {
                  border: '2px solid #1976d2',
                  transform: 'scale(1.1)',
                },
              }}
              onClick={() => handleColorClick(color)}
            />
          ))}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Custom Color Picker */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            label="Custom Color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#000000"
            sx={{ flexGrow: 1 }}
          />
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: customColor,
              border: '1px solid #ccc',
              borderRadius: 1,
            }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={handleCustomColorSubmit}
            disabled={!customColor.match(/^#[0-9A-Fa-f]{6}$/)}
          >
            Apply
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Enter hex color code (e.g., #FF5733)
        </Typography>
      </Paper>
    </Popover>
  );
};

/**
 * Quill editor modules configuration
 */
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': EXCEL_COLORS }, { 'background': EXCEL_COLORS }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ]
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'align',
  'link', 'image'
];


/**
 * Home page: displays, creates, edits, deletes, searches, and filters notes.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const theme = useTheme();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [folders, setFolders] = useState<string[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedTitle] = useState('');
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // const [isEditMode, setIsEditMode] = useState(false);
  const canvasRef = useRef<any>(null);
  
  // Drawing tools state
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Color picker state for text editor
  const [textColorPickerOpen, setTextColorPickerOpen] = useState(false);
  const [backgroundColorPickerOpen, setBackgroundColorPickerOpen] = useState(false);
  const [textColorAnchorEl, setTextColorAnchorEl] = useState<HTMLElement | null>(null);
  const [backgroundColorAnchorEl, setBackgroundColorAnchorEl] = useState<HTMLElement | null>(null);
  const [quillRef, setQuillRef] = useState<any>(null);


  // Canvas data is now loaded automatically via the saveData prop

  // Optimized drawing tool functions with useCallback
  const handleBrushTool = useCallback(() => {
    setIsEraser(false);
    setBrushColor('#000000');
  }, []);

  const handleEraserTool = useCallback(() => {
    setIsEraser(true);
    setBrushColor('#ffffff'); // White for eraser
  }, []);

  const handleUndo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.undo();
    }
  }, []);

  const handleRedo = useCallback(() => {
    // Note: react-canvas-draw doesn't support redo functionality
    console.log('Redo not supported by react-canvas-draw');
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setBrushColor(color);
    setIsEraser(false);
  }, []);

  // Optimized canvas initialization - no delay for faster loading
  useEffect(() => {
    if (editNote && (editNote.type === 'handwritten' || editNote.content === 'Handwritten Note')) {
      // Immediate initialization for faster loading
      if (canvasRef.current) {
        // Only clear if there's no existing data to preserve
        if (!editNote.drawingData) {
          canvasRef.current.clear();
        }
        // Load data immediately if available
        if (editNote.drawingData) {
          canvasRef.current.loadSaveData(editNote.drawingData, true);
        }
      }
    }
  }, [editNote]);

  // Keyboard shortcuts for premium experience
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when editing handwritten notes
      if (!editNote || (editNote.type !== 'handwritten' && editNote.content !== 'Handwritten Note')) {
        return;
      }

      // Prevent default for our shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            handleUndo();
            break;
          case 'e':
            event.preventDefault();
            handleEraserTool();
            break;
          case 'b':
            event.preventDefault();
            handleBrushTool();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editNote, handleBrushTool, handleEraserTool, handleUndo]);

  // Memoized predefined colors for better performance
  const predefinedColors = useMemo(() => [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ], []);

  // Color picker handlers for text editor
  const handleTextColorPickerClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setTextColorAnchorEl(event.currentTarget);
    setTextColorPickerOpen(true);
  }, []);

  const handleBackgroundColorPickerClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setBackgroundColorAnchorEl(event.currentTarget);
    setBackgroundColorPickerOpen(true);
  }, []);

  const handleTextColorSelect = useCallback((color: string) => {
    if (quillRef && quillRef.getEditor) {
      const editor = quillRef.getEditor();
      const range = editor.getSelection();
      if (range) {
        editor.formatText(range.index, range.length, 'color', color);
      } else {
        editor.format('color', color);
      }
    }
    setTextColorPickerOpen(false);
  }, [quillRef]);

  const handleBackgroundColorSelect = useCallback((color: string) => {
    if (quillRef && quillRef.getEditor) {
      const editor = quillRef.getEditor();
      const range = editor.getSelection();
      if (range) {
        editor.formatText(range.index, range.length, 'background', color);
      } else {
        editor.format('background', color);
      }
    }
    setBackgroundColorPickerOpen(false);
  }, [quillRef]);


  // Fetch notes, folders, and tags on mount or when token changes
  useEffect(() => {
    if (token) {
      fetchNotes();
      api.get('/notes/folders', token ?? undefined)
        .then(setFolders)
        .catch(() => setFolders([]));
      api.get('/notes/tags', token ?? undefined)
        .then(setTagsList)
        .catch(() => setTagsList([]));
    }
    // eslint-disable-next-line
  }, [token]);

  /**
   * Fetch notes from the backend with caching for faster loading.
   */
  const fetchNotes = async (
    searchQuery = '',
    folderFilter = '',
    tagFilter = '',
    titleFilter = ''
  ) => {
    try {
      // Use cache for initial load (no filters)
      if (!searchQuery && !folderFilter && !tagFilter && !titleFilter) {
        const cacheKey = `notes_${token?.slice(-10)}`;
        const cachedNotes = localStorage.getItem(cacheKey);
        
        if (cachedNotes) {
          try {
            const parsedNotes = JSON.parse(cachedNotes);
            setNotes(Array.isArray(parsedNotes) ? parsedNotes : []);
            
            // Load fresh data in background
            setTimeout(async () => {
              try {
                const data = await api.get('/notes', token ?? undefined);
                setNotes(Array.isArray(data) ? data : []);
                localStorage.setItem(cacheKey, JSON.stringify(data));
              } catch (e) {
                console.error('Background refresh failed:', e);
              }
            }, 100);
            return;
          } catch (e) {
            // Cache corrupted, continue with fresh load
          }
        }
      }
      
      let endpoint = '/notes';
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (folderFilter) params.append('folder', folderFilter);
      if (tagFilter) params.append('tag', tagFilter);
      if (titleFilter) params.append('title', titleFilter);
      if (params.toString()) endpoint = `/notes/search?${params.toString()}`;
      const data = await api.get(endpoint, token ?? undefined);
      setNotes(Array.isArray(data) ? data : []);
      
      // Cache the results for faster subsequent loads
      if (!searchQuery && !folderFilter && !tagFilter && !titleFilter) {
        const cacheKey = `notes_${token?.slice(-10)}`;
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        setError('Please log in to view your notes');
      }
    }
  };

  /**
   * Handle note creation.
   */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/notes', {
        title,
        content,
        folder,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }, token ?? undefined);
      if (res._id) {
        setNotes([res, ...notes]);
        setTitle('');
        setContent('');
        setFolder('');
        setTags('');
        setCreateDialogOpen(false);
        if (!folders.includes(folder) && folder) setFolders([...folders, folder]);
        res.tags?.forEach((tag: string) => {
          if (!tagsList.includes(tag)) setTagsList([...tagsList, tag]);
        });
      } else {
        setError(res.message || 'Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to create note');
      }
    }
  };

  /**
   * Handle note deletion with confirmation dialog.
   */
  const handleDelete = async () => {
    if (!deleteNoteId) return;
    try {
      await api.delete(`/notes/${deleteNoteId}`, token ?? undefined);
      setNotes(notes.filter(note => note._id !== deleteNoteId));
      setDeleteNoteId(null);
    } catch (error) {
      console.error('Error deleting note:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to delete note');
      }
    }
  };

  /**
   * Handle note update/create.
   */
  const handleUpdate = async () => {
    if (!editNote) return;
    try {
      let updateData: any = {
        title: editNote.title,
        content: editNote.content,
        folder: editNote.folder,
        tags: editNote.tags,
      };

      // For handwritten notes, get canvas data
      if ((editNote.type === 'handwritten' || editNote.content === 'Handwritten Note')) {
        if (canvasRef.current) {
          const canvasData = canvasRef.current.getSaveData();
          updateData.drawingData = canvasData;
          updateData.content = 'Handwritten Note'; // Placeholder content
          updateData.type = 'handwritten';
        } else {
          console.error('Canvas ref is not available!');
          setError('Canvas not available for saving');
          return;
        }
      }

      let res: any;
      if (editNote._id === 'temp') {
        // Creating new note
        res = await api.post('/notes', updateData, token ?? undefined);
        if (res._id) {
          setNotes([res, ...notes]);
          // Update folders and tags lists
          if (editNote.folder && !folders.includes(editNote.folder)) {
            setFolders([...folders, editNote.folder]);
          }
          editNote.tags?.forEach((tag: string) => {
            if (!tagsList.includes(tag)) {
              setTagsList([...tagsList, tag]);
            }
          });
        }
      } else {
        // Updating existing note
        res = await api.put(`/notes/${editNote._id}`, updateData, token ?? undefined);
        if (res._id) {
          setNotes(notes.map(note => (note._id === editNote._id ? res : note)));
        }
      }
      
      setEditNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update note');
      }
    }
  };

  /**
   * Handle search only.
   */
  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   fetchNotes(search, '', '', '');
  // };

  /**
   * Handle filter only.
   */
  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes('', selectedFolder, selectedTag, selectedTitle);
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

  const truncateContent = (content: string, maxLength: number = 150) => {
    // Remove HTML tags for preview
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  // For title filter dropdown
  // const uniqueTitles = Array.from(new Set(notes.map(n => n.title)));

  if (!token) {
    return (
      <Box maxWidth={700} mx="auto" mt={4} textAlign="center">
        <Typography variant="h5" mb={2}>Welcome to ThoughtCloud</Typography>
        <Typography variant="body1" mb={3}>
          Please log in to view and manage your notes.
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
            My Notes
          </Typography>
          
          {/* Search and Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
              <TextField
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                sx={{ bgcolor: 'background.default' }}
              />
              <Button 
                variant="outlined" 
                onClick={() => setShowFilters(!showFilters)}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                <FilterListIcon />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                onClick={() => setCreateDialogOpen(true)}
                startIcon={<AddIcon />}
                sx={{ 
                  whiteSpace: 'nowrap',
                  px: 3,
                  py: 1,
                  minHeight: '40px'
                }}
              >
                New Note
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/handwritten/new')}
                startIcon={<EditIcon />}
                sx={{ 
                  whiteSpace: 'nowrap',
                  px: 3,
                  py: 1,
                  minHeight: '40px'
                }}
              >
                Handwritten
              </Button>
            </Box>
          </Box>

          {/* Filters */}
          {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                             <form onSubmit={handleFilter}>
                 <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                   <FormControl size="small" fullWidth>
                     <InputLabel>Folder</InputLabel>
                     <Select
                       value={selectedFolder}
                       label="Folder"
                       onChange={e => setSelectedFolder(e.target.value)}
                     >
                       <MenuItem value="">All Folders</MenuItem>
                       {folders.map(f => (
                         <MenuItem key={f} value={f}>{f}</MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                   <FormControl size="small" fullWidth>
                     <InputLabel>Tag</InputLabel>
                     <Select
                       value={selectedTag}
                       label="Tag"
                       onChange={e => setSelectedTag(e.target.value)}
                     >
                       <MenuItem value="">All Tags</MenuItem>
                       {tagsList.map(t => (
                         <MenuItem key={t} value={t}>{t}</MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                   <Button 
                     type="submit" 
                     variant="outlined" 
                     fullWidth
                     sx={{ height: '40px' }}
                   >
                     Apply Filters
                   </Button>
                 </Box>
               </form>
            </Box>
          )}
        </Box>
      </Box>

      {/* Notes Grid */}
      <Box maxWidth={1200} mx="auto" px={{ xs: 2, sm: 3 }} pt={4}>
        {notes.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" mb={2}>
              No notes found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {search || selectedFolder || selectedTag ? 'Try adjusting your search or filters.' : 'Create your first note to get started!'}
            </Typography>
            {!search && !selectedFolder && !selectedTag && (
              <Button 
                variant="contained" 
                onClick={() => setCreateDialogOpen(true)}
                startIcon={<AddIcon />}
              >
                Create Your First Note
              </Button>
            )}
          </Box>
                 ) : (
           <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
             {notes.map(note => (
               <Box key={note._id}>
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
                  onClick={() => {
                    if (note.type === 'handwritten' || note.content === 'Handwritten Note') {
                      navigate(`/handwritten/${note._id}`);
                    } else {
                      setViewNote(note);
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        lineHeight: 1.3
                      }}>
                        {note.title}
                      </Typography>
                      {note.type === 'handwritten' && (
                        <Chip 
                          label="📝" 
                          size="small" 
                          sx={{ 
                            fontSize: '0.75rem',
                            height: '20px',
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText'
                          }} 
                        />
                      )}
                    </Box>
                    
                    {note.type === 'handwritten' || note.content === 'Handwritten Note' ? (
                      <Box sx={{ 
                        height: 80, 
                        backgroundColor: '#f8f9fa', 
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 2
                      }}>
                        {note.drawingData ? (
                          <Box sx={{ 
                            fontSize: '0.75rem', 
                            color: 'text.secondary',
                            textAlign: 'center',
                            p: 1
                          }}>
                            📝 Handwritten Note
                            <br />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              Click to edit
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            fontSize: '0.75rem', 
                            color: 'text.secondary',
                            textAlign: 'center'
                          }}>
                            📝 Empty Handwritten Note
                            <br />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              Click to create
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.875rem', md: '0.9rem' },
                        lineHeight: 1.4
                      }}>
                        {truncateContent(note.content, 100)}
                      </Typography>
                    )}

                    {note.folder && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FolderIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          {note.folder}
                        </Typography>
                      </Box>
                    )}

                    {note.tags && note.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {note.tags.slice(0, 3).map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            icon={<LabelIcon />}
                            sx={{ 
                              fontSize: '0.75rem',
                              height: '20px'
                            }} 
                          />
                        ))}
                        {note.tags.length > 3 && (
                          <Chip 
                            label={`+${note.tags.length - 3}`} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.75rem',
                              height: '20px'
                            }} 
                          />
                        )}
                      </Box>
                    )}

                    {note.updatedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Updated {formatDate(note.updatedAt)}
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
                            if (note.type === 'handwritten' || note.content === 'Handwritten Note') {
                              navigate(`/handwritten/${note._id}`);
                            } else {
                              setViewNote(note);
                            }
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
                            if (note.type === 'handwritten' || note.content === 'Handwritten Note') {
                              navigate(`/handwritten/${note._id}`);
                            } else {
                              setEditNote(note);
                            }
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
                            setDeleteNoteId(note._id);
                          }}
                          sx={{ ml: 'auto' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                                 </Card>
               </Box>
             ))}
           </Box>
        )}
      </Box>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add note"
        onClick={() => setCreateDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Create Note Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        disableRestoreFocus={true}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: '90vw', md: '80vw' },
            maxWidth: { xs: 'calc(100% - 32px)', sm: '90vw', md: '80vw' },
            height: { xs: 'calc(100% - 32px)', sm: 'auto' },
            maxHeight: { xs: 'calc(100% - 32px)', sm: '80vh' }
          }
        }}
      >
        <DialogTitle>Create a Note</DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent sx={{ pb: 1 }}>
            <TextField
              label="Title"
              fullWidth
              margin="normal"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              size="small"
              sx={{ mb: 1 }}
            />
            
            {/* Folder and Tags side by side */}
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <TextField
                label="Folder"
                fullWidth
                margin="normal"
                value={folder}
                onChange={e => setFolder(e.target.value)}
                size="small"
              />
              <TextField
                label="Tags (comma separated)"
                fullWidth
                margin="normal"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="work, ideas, personal"
                size="small"
              />
            </Box>
            
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Content
            </Typography>
            
            <Box sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                style={{ height: '300px' }}
                ref={setQuillRef}
              />
              
              {/* Custom Color Picker Buttons - positioned after Quill toolbar */}
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5, 
                p: 0.5, 
                borderTop: '1px solid #ccc',
                backgroundColor: '#f8f9fa',
                alignItems: 'center'
              }}>
                <Tooltip title="Text Color">
                  <IconButton
                    size="small"
                    onClick={handleTextColorPickerClick}
                    sx={{ 
                      width: 28,
                      height: 28,
                      p: 0.5,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textDecoration: 'underline'
                    }}
                  >
                    A
                  </IconButton>
                </Tooltip>
                <Tooltip title="Background Color">
                  <IconButton
                    size="small"
                    onClick={handleBackgroundColorPickerClick}
                    sx={{ 
                      width: 28,
                      height: 28,
                      p: 0.5,
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    A
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create Note</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog 
        open={!!editNote} 
        onClose={() => setEditNote(null)} 
        maxWidth="lg" 
        fullWidth
        disableEscapeKeyDown={false}
        disableRestoreFocus={true}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: '90vw', md: '80vw' },
            maxWidth: { xs: 'calc(100% - 32px)', sm: '90vw', md: '80vw' },
            height: { xs: 'calc(100% - 32px)', sm: 'auto' },
            maxHeight: { xs: 'calc(100% - 32px)', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>
          {(editNote?.type === 'handwritten' || editNote?.content === 'Handwritten Note') ? 'Edit Handwritten Note' : 'Edit Note'}
        </DialogTitle>
        <DialogContent sx={{ pb: 1, overflow: 'auto', maxHeight: '70vh' }}>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={editNote?.title || ''}
            onChange={e => setEditNote(editNote ? { ...editNote, title: e.target.value } : null)}
            size="small"
            sx={{ mb: 1 }}
          />
          
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Content
          </Typography>
          
          {(editNote?.type === 'handwritten' || editNote?.content === 'Handwritten Note') && editNote ? (
            // Premium drawing interface for handwritten notes
            <Box sx={{ mb: 2 }}>
              {/* Drawing Tools Toolbar */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2, 
                p: 1, 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1,
                backgroundColor: 'background.paper',
                flexWrap: 'wrap'
              }}>
                {/* Keyboard Shortcuts Info */}
                <Tooltip title="Keyboard Shortcuts: Ctrl+Z (Undo), Ctrl+B (Brush), Ctrl+E (Eraser)">
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary', 
                    fontSize: '0.75rem',
                    mr: 1,
                    cursor: 'help'
                  }}>
                    💡 Pro Tip: Use keyboard shortcuts for faster drawing!
                  </Typography>
                </Tooltip>
                {/* Tool Selection */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Brush">
                    <IconButton 
                      onClick={handleBrushTool}
                      color={!isEraser ? 'primary' : 'default'}
                      sx={{ 
                        border: !isEraser ? 2 : 1,
                        borderColor: !isEraser ? 'primary.main' : 'divider'
                      }}
                    >
                      <BrushIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eraser">
                    <IconButton 
                      onClick={handleEraserTool}
                      color={isEraser ? 'primary' : 'default'}
                      sx={{ 
                        border: isEraser ? 2 : 1,
                        borderColor: isEraser ? 'primary.main' : 'divider'
                      }}
                    >
                      <EraserIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider orientation="vertical" flexItem />

                {/* Brush Size Control */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                  <Typography variant="body2" sx={{ minWidth: 40 }}>
                    Size:
                  </Typography>
                  <Slider
                    value={brushSize}
                    onChange={(_, value) => setBrushSize(value as number)}
                    min={1}
                    max={20}
                    step={1}
                    size="small"
                    sx={{ width: 80 }}
                  />
                  <Typography variant="body2" sx={{ minWidth: 20 }}>
                    {brushSize}
                  </Typography>
                </Box>

                <Divider orientation="vertical" flexItem />

                {/* Color Selection */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">Color:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {predefinedColors.map((color) => (
                      <Tooltip key={color} title={color}>
                        <Box
                          onClick={() => handleColorChange(color)}
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: color,
                            border: brushColor === color ? 2 : 1,
                            borderColor: brushColor === color ? 'primary.main' : 'divider',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            '&:hover': { transform: 'scale(1.1)' },
                            transition: 'transform 0.2s'
                          }}
                        />
                      </Tooltip>
                    ))}
                    <Tooltip title="Custom Color">
                      <IconButton 
                        size="small"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        sx={{ 
                          border: 1, 
                          borderColor: 'divider',
                          ml: 0.5
                        }}
                      >
                        A
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider orientation="vertical" flexItem />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Undo">
                    <IconButton onClick={handleUndo} size="small">
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Redo (Not supported by react-canvas-draw)">
                    <span>
                      <IconButton onClick={handleRedo} size="small" disabled>
                        <RedoIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Clear Canvas">
                    <IconButton onClick={handleClearCanvas} size="small" color="error">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Custom Color Picker */}
              {showColorPicker && (
                <Box sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Custom Color:</Typography>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    style={{
                      width: '100%',
                      height: 40,
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  />
                </Box>
              )}

              {/* Canvas */}
              <Box sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1, 
                minHeight: '250px',
                maxHeight: '300px',
                overflow: 'auto',
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Suspense fallback={
                  <Box sx={{ 
                    width: '500px', 
                    height: '250px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading canvas...
                    </Typography>
                  </Box>
                }>
                  <CanvasDraw
                    ref={canvasRef}
                    brushColor={brushColor}
                    brushRadius={brushSize}
                    lazyRadius={0}
                    canvasWidth={500}
                    canvasHeight={250}
                    saveData={editNote?.drawingData || ''}
                    style={{
                      border: 'none',
                      borderRadius: '4px',
                      display: 'block',
                      width: '500px',
                      height: '250px',
                      minWidth: '500px',
                      minHeight: '250px'
                    }}
                  />
                </Suspense>
              </Box>
            </Box>
          ) : null}
          
          {/* Folder and Tags side by side */}
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <TextField
              label="Folder"
              fullWidth
              margin="normal"
              value={editNote?.folder || ''}
              onChange={e => setEditNote(editNote ? { ...editNote, folder: e.target.value } : null)}
              size="small"
            />
            <TextField
              label="Tags (comma separated)"
              fullWidth
              margin="normal"
              value={editNote?.tags?.join(', ') || ''}
              onChange={e =>
                setEditNote(
                  editNote
                    ? { ...editNote, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }
                    : null
                )
              }
              placeholder="work, ideas, personal"
              size="small"
            />
          </Box>
          
          {/* Rich text editor for regular notes - moved below folder and tags */}
          {!(editNote?.type === 'handwritten' || editNote?.content === 'Handwritten Note') && (
            <Box sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <ReactQuill
                theme="snow"
                value={editNote?.content || ''}
                onChange={(value) => setEditNote(editNote ? { ...editNote, content: value } : null)}
                modules={quillModules}
                formats={quillFormats}
                style={{ height: '300px' }}
                ref={setQuillRef}
              />
              
              {/* Custom Color Picker Buttons - positioned after Quill toolbar */}
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5, 
                p: 0.5, 
                borderTop: '1px solid #ccc',
                backgroundColor: '#f8f9fa',
                alignItems: 'center'
              }}>
                <Tooltip title="Text Color">
                  <IconButton
                    size="small"
                    onClick={handleTextColorPickerClick}
                    sx={{ 
                      width: 28,
                      height: 28,
                      p: 0.5,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textDecoration: 'underline'
                    }}
                  >
                    A
                  </IconButton>
                </Tooltip>
                <Tooltip title="Background Color">
                  <IconButton
                    size="small"
                    onClick={handleBackgroundColorPickerClick}
                    sx={{ 
                      width: 28,
                      height: 28,
                      p: 0.5,
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    A
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNote(null)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog 
        open={!!viewNote} 
        onClose={() => setViewNote(null)} 
        maxWidth="lg" 
        fullWidth
        disableRestoreFocus={true}
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {viewNote?.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Edit">
                <IconButton 
                  size="small"
                  onClick={() => {
                    if (viewNote) {
                      if (viewNote.type === 'handwritten' || viewNote.content === 'Handwritten Note') {
                        navigate(`/handwritten/${viewNote._id}`);
                      } else {
                        setEditNote(viewNote);
                        setViewNote(null);
                      }
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
                    setDeleteNoteId(viewNote?._id || null);
                    setViewNote(null);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {viewNote && (
            <>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FolderIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {viewNote.folder || 'No folder'}
                  </Typography>
                </Box>
                
                {viewNote.tags && viewNote.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {viewNote.tags.map(tag => (
                      <Chip 
                        key={tag} 
                        label={tag} 
                        size="small" 
                        icon={<LabelIcon />}
                        sx={{ fontSize: '0.75rem' }} 
                      />
                    ))}
                  </Box>
                )}
                
                {viewNote.updatedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {formatDate(viewNote.updatedAt)}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {viewNote.type === 'handwritten' ? (
                <Box sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  overflow: 'hidden',
                  minHeight: '300px'
                }}>
                  <Suspense fallback={
                    <Box sx={{ 
                      width: '500px', 
                      height: '250px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading canvas...
                      </Typography>
                    </Box>
                  }>
                    <CanvasDraw
                      brushColor="#000000"
                      brushRadius={2}
                      lazyRadius={0}
                      canvasWidth={500}
                      canvasHeight={250}
                      saveData={viewNote.drawingData}
                      disabled={true}
                      style={{
                        border: 'none',
                        borderRadius: '4px',
                        width: '500px',
                        height: '250px'
                      }}
                    />
                  </Suspense>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    '& .ql-editor': { 
                      padding: 0,
                      fontSize: '1rem',
                      lineHeight: 1.6
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: viewNote.content }}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewNote(null)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (viewNote) {
                if (viewNote.type === 'handwritten' || viewNote.content === 'Handwritten Note') {
                  navigate(`/handwritten/${viewNote._id}`);
                } else {
                  setEditNote(viewNote);
                  setViewNote(null);
                }
              }
            }}
          >
            Edit Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!deleteNoteId} 
        onClose={() => setDeleteNoteId(null)}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this note?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteNoteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Color Picker Components */}
      <ColorPicker
        open={textColorPickerOpen}
        anchorEl={textColorAnchorEl}
        onClose={() => setTextColorPickerOpen(false)}
        onColorSelect={handleTextColorSelect}
        type="text"
      />
      
      <ColorPicker
        open={backgroundColorPickerOpen}
        anchorEl={backgroundColorAnchorEl}
        onClose={() => setBackgroundColorPickerOpen(false)}
        onColorSelect={handleBackgroundColorSelect}
        type="background"
      />

    </Box>
  );
};

export default Home;