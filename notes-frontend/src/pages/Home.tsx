import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  TextField, Button, Box, Typography, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Note interface for type safety.
 */
interface Note {
  _id: string;
  title: string;
  content: string;
  folder?: string;
  tags?: string[];
}

/**
 * Home page: displays, creates, edits, deletes, searches, and filters notes.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
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
    <Box maxWidth={700} mx="auto" mt={4} px={{ xs: 2, sm: 3 }}>
      {/* Error Display */}
      {error && (
        <Box mb={3} p={2} bgcolor="error.light" borderRadius={1}>
          <Typography color="error.contrastText">{error}</Typography>
        </Box>
      )}

      {/* Create Note Button */}
      <Box display="flex" justifyContent="center" mb={4}>
  <Button
    variant="contained"
    color="primary"
    onClick={() => setCreateDialogOpen(true)}
    sx={{
      px: { xs: 4, md: 6 },
      py: { xs: 1.5, md: 2 },
      fontSize: { xs: '1.1rem', md: '1.3rem' },
      fontWeight: 'bold',
      boxShadow: 3,
      borderRadius: 3,
      textTransform: 'none',
      letterSpacing: 1,
      transition: 'transform 0.2s',
      minHeight: { xs: '48px', md: '56px' },
      width: { xs: '100%', sm: 'auto' },
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: 6,
      },
    }}
  >
    + Create Note
  </Button>
</Box>

      {/* Search UI */}
      <form onSubmit={handleSearch} style={{ width: '100%', marginBottom: 16 }}>
        <Box display="flex" width="100%" alignItems="center" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
          <TextField
            label="Search (Title/Folder/Tags)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            fullWidth
          />
          <Button 
            type="submit" 
            variant="outlined" 
            sx={{ 
              whiteSpace: 'nowrap',
              width: { xs: '100%', sm: 'auto' },
              minHeight: { xs: '40px', sm: 'auto' }
            }}
          >
            Search
          </Button>
        </Box>
      </form>

      {/* Filter UI */}
      <form onSubmit={handleFilter} style={{ width: '100%', marginBottom: 16 }}>
        <Box display="flex" width="100%" alignItems="center" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
          <FormControl size="small" sx={{ minWidth: 120, flex: 1, width: '100%' }}>
            <InputLabel>Folder</InputLabel>
            <Select
              value={selectedFolder}
              label="Folder"
              onChange={e => setSelectedFolder(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {folders.map(f => (
                <MenuItem key={f} value={f}>{f}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120, flex: 1, width: '100%' }}>
            <InputLabel>Tag</InputLabel>
            <Select
              value={selectedTag}
              label="Tag"
              onChange={e => setSelectedTag(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {tagsList.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120, flex: 1, width: '100%' }}>
            <InputLabel>Title</InputLabel>
            <Select
              value={selectedTitle}
              label="Title"
              onChange={e => setSelectedTitle(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueTitles.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            type="submit" 
            variant="outlined" 
            color="secondary" 
            sx={{ 
              whiteSpace: 'nowrap',
              width: { xs: '100%', sm: 'auto' },
              minHeight: { xs: '40px', sm: 'auto' }
            }}
          >
            Filter
          </Button>
        </Box>
      </form>

      <Typography variant="h5" mt={4} mb={2} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>Your Notes</Typography>
      {notes.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">No notes found.</Typography>
        </Box>
      ) : (
        notes.map(note => (
          <Box key={note._id} border={1} borderRadius={2} p={{ xs: 1.5, md: 2 }} mb={2} position="relative">
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' }, mb: 1 }}>
              {note.title}
            </Typography>
            <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' }, mb: 1 }}>
              {note.content}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
              Folder: {note.folder || 'None'}
            </Typography>
            <Box mt={1} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {note.tags?.map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  size="small" 
                  sx={{ 
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    height: { xs: '24px', md: '32px' }
                  }} 
                />
              ))}
            </Box>
            <Box position="absolute" top={{ xs: 4, md: 8 }} right={{ xs: 4, md: 8 }}>
              <IconButton 
                size="small"
                onClick={() => setEditNote(note)}
                sx={{ p: { xs: 0.5, md: 1 } }}
              >
                <EditIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
              </IconButton>
              <IconButton 
                size="small"
                onClick={() => setDeleteNoteId(note._id)}
                sx={{ p: { xs: 0.5, md: 1 } }}
              >
                <DeleteIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
              </IconButton>
            </Box>
          </Box>
        ))
      )}

      {/* Create Note Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>Create a Note</DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent>
            <TextField
              label="Title"
              fullWidth
              margin="normal"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <TextField
              label="Content"
              fullWidth
              margin="normal"
              multiline
              minRows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
            <TextField
              label="Folder"
              fullWidth
              margin="normal"
              value={folder}
              onChange={e => setFolder(e.target.value)}
            />
            <TextField
              label="Tags (comma separated)"
              fullWidth
              margin="normal"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
            {error && <Typography color="error">{error}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog 
        open={!!editNote} 
        onClose={() => setEditNote(null)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={editNote?.title || ''}
            onChange={e => setEditNote(editNote ? { ...editNote, title: e.target.value } : null)}
          />
          <TextField
            label="Content"
            fullWidth
            margin="normal"
            multiline
            minRows={3}
            value={editNote?.content || ''}
            onChange={e => setEditNote(editNote ? { ...editNote, content: e.target.value } : null)}
          />
          <TextField
            label="Folder"
            fullWidth
            margin="normal"
            value={editNote?.folder || ''}
            onChange={e => setEditNote(editNote ? { ...editNote, folder: e.target.value } : null)}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNote(null)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">Save</Button>
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