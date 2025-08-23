import React, { useEffect, useState } from 'react';
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
  Grid,
  Fab,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery
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

/**
 * Note interface for type safety.
 */
interface Note {
  _id: string;
  title: string;
  content: string;
  folder?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Quill editor modules configuration
 */
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
  const [selectedTitle, setSelectedTitle] = useState('');
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
   * Fetch notes from the backend, optionally with search/filter.
   */
  const fetchNotes = async (
    searchQuery = '',
    folderFilter = '',
    tagFilter = '',
    titleFilter = ''
  ) => {
    try {
      let endpoint = '/notes';
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (folderFilter) params.append('folder', folderFilter);
      if (tagFilter) params.append('tag', tagFilter);
      if (titleFilter) params.append('title', titleFilter);
      if (params.toString()) endpoint = `/notes/search?${params.toString()}`;
      const data = await api.get(endpoint, token ?? undefined);
      setNotes(Array.isArray(data) ? data : []);
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
   * Handle note update.
   */
  const handleUpdate = async () => {
    if (!editNote) return;
    try {
      const res = await api.put(`/notes/${editNote._id}`, {
        title: editNote.title,
        content: editNote.content,
        folder: editNote.folder,
        tags: editNote.tags,
      }, token ?? undefined);
      setNotes(notes.map(note => (note._id === editNote._id ? res : note)));
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
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes(search, '', '', '');
  };

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
  const uniqueTitles = Array.from(new Set(notes.map(n => n.title)));

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
                    setViewNote(note);
                    setIsEditMode(false);
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      lineHeight: 1.3
                    }}>
                      {note.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mb: 2,
                      fontSize: { xs: '0.875rem', md: '0.9rem' },
                      lineHeight: 1.4
                    }}>
                      {truncateContent(note.content, 100)}
                    </Typography>

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
                            setViewNote(note);
                            setIsEditMode(false);
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
                            setEditNote(note);
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
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
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
              sx={{ mb: 2 }}
            />
            
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
                style={{ height: '200px' }}
              />
            </Box>
            
            <TextField
              label="Folder"
              fullWidth
              margin="normal"
              value={folder}
              onChange={e => setFolder(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Tags (comma separated)"
              fullWidth
              margin="normal"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="work, ideas, personal"
            />
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
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
            height: { xs: 'calc(100% - 32px)', sm: 'auto' },
            maxHeight: { xs: 'calc(100% - 32px)', sm: '80vh' }
          }
        }}
      >
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={editNote?.title || ''}
            onChange={e => setEditNote(editNote ? { ...editNote, title: e.target.value } : null)}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Content
          </Typography>
          <Box sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <ReactQuill
              theme="snow"
              value={editNote?.content || ''}
              onChange={(value) => setEditNote(editNote ? { ...editNote, content: value } : null)}
              modules={quillModules}
              formats={quillFormats}
              style={{ height: '200px' }}
            />
          </Box>
          
          <TextField
            label="Folder"
            fullWidth
            margin="normal"
            value={editNote?.folder || ''}
            onChange={e => setEditNote(editNote ? { ...editNote, folder: e.target.value } : null)}
            sx={{ mb: 2 }}
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
          />
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {viewNote?.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Edit">
                <IconButton 
                  size="small"
                  onClick={() => {
                    setEditNote(viewNote);
                    setViewNote(null);
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewNote(null)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setEditNote(viewNote);
              setViewNote(null);
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
    </Box>
  );
};

export default Home;