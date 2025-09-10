import React, { useRef, useState } from 'react';
import CanvasDraw from 'react-canvas-draw';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Save as SaveIcon,
  Undo as UndoIcon,
  Clear as ClearIcon,
  Palette as PaletteIcon,
  Brush as BrushIcon,
  AutoFixHigh as EraserIcon
} from '@mui/icons-material';

/**
 * Interface for handwritten note data
 */
interface HandwrittenNoteData {
  title: string;
  folder: string;
  tags: string[];
  drawingData: string;
}

/**
 * Props for HandwrittenNote component
 */
interface HandwrittenNoteProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HandwrittenNoteData) => void;
  initialData?: Partial<HandwrittenNoteData>;
}

/**
 * Handwritten note creation/editing component with canvas drawing functionality
 */
const HandwrittenNote: React.FC<HandwrittenNoteProps> = ({
  open,
  onClose,
  onSave,
  initialData = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const canvasRef = useRef<CanvasDraw>(null);
  const [title, setTitle] = useState(initialData.title || '');
  const [folder, setFolder] = useState(initialData.folder || '');
  const [tags, setTags] = useState(initialData.tags?.join(', ') || '');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle canvas clear action
   */
  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  };

  /**
   * Handle canvas undo action
   */
  const handleUndo = () => {
    if (canvasRef.current) {
      canvasRef.current.undo();
    }
  };

  /**
   * Handle save action
   */
  const handleSave = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!canvasRef.current) {
      setError('Canvas not initialized');
      return;
    }

    const drawingData = canvasRef.current.getSaveData();
    
    // Check if canvas has any content
    if (!drawingData || drawingData === '[]') {
      setError('Please draw something before saving');
      return;
    }

    const noteData: HandwrittenNoteData = {
      title: title.trim(),
      folder: folder.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      drawingData
    };

    onSave(noteData);
    handleClose();
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    setTitle('');
    setFolder('');
    setTags('');
    setBrushColor('#000000');
    setBrushSize(2);
    setIsEraser(false);
    setError('');
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    onClose();
  };

  /**
   * Load initial drawing data if editing
   */
  React.useEffect(() => {
    if (open && initialData.drawingData && canvasRef.current) {
      try {
        console.log('Loading canvas data:', initialData.drawingData);
        canvasRef.current.loadSaveData(initialData.drawingData, true);
      } catch (error) {
        console.error('Error loading canvas data:', error);
      }
    }
  }, [open, initialData.drawingData]);

  /**
   * Reset canvas when dialog opens for new note
   */
  React.useEffect(() => {
    if (open && !initialData.drawingData && canvasRef.current) {
      canvasRef.current.clear();
    }
  }, [open, initialData.drawingData]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          margin: { xs: 0, sm: 'auto' },
          width: { xs: '100%', sm: '90vw' },
          height: { xs: '100vh', sm: '90vh' },
          maxWidth: { xs: '100vw', sm: '1200px' }
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📝 {initialData.title ? 'Edit Handwritten Note' : 'New Handwritten Note'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Clear Canvas">
              <IconButton onClick={handleClear} size="small">
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Undo">
              <IconButton onClick={handleUndo} size="small">
                <UndoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Note Details */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ flex: 1 }}
          />
          <TextField
            label="Folder"
            fullWidth
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            sx={{ flex: 1 }}
          />
        </Box>

        <TextField
          label="Tags (comma separated)"
          fullWidth
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="work, ideas, personal"
        />

        {/* Drawing Tools */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tool Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant={!isEraser ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setIsEraser(false)}
              startIcon={<BrushIcon />}
              sx={{ minWidth: 80 }}
            >
              Brush
            </Button>
            <Button
              variant={isEraser ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setIsEraser(true)}
              startIcon={<EraserIcon />}
              sx={{ minWidth: 80 }}
            >
              Eraser
            </Button>
          </Box>

          {/* Color Picker (only for brush) */}
          {!isEraser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaletteIcon sx={{ fontSize: 20 }} />
              <TextField
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                sx={{ width: 60, height: 40 }}
                size="small"
              />
            </Box>
          )}
          
          {/* Size Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEraser ? <EraserIcon sx={{ fontSize: 20 }} /> : <BrushIcon sx={{ fontSize: 20 }} />}
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Size</InputLabel>
              <Select
                value={brushSize}
                label="Size"
                onChange={(e) => setBrushSize(Number(e.target.value))}
              >
                <MenuItem value={1}>1px</MenuItem>
                <MenuItem value={2}>2px</MenuItem>
                <MenuItem value={4}>4px</MenuItem>
                <MenuItem value={6}>6px</MenuItem>
                <MenuItem value={8}>8px</MenuItem>
                <MenuItem value={10}>10px</MenuItem>
                <MenuItem value={15}>15px</MenuItem>
                <MenuItem value={20}>20px</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Divider />

        {/* Canvas Drawing Area */}
        <Box sx={{ 
          border: 1, 
          borderColor: 'divider', 
          borderRadius: 1,
          overflow: 'hidden',
          flex: 1,
          minHeight: { xs: '300px', sm: '400px' }
        }}>
          <CanvasDraw
            ref={canvasRef}
            brushColor={isEraser ? '#FFFFFF' : brushColor}
            brushRadius={brushSize}
            lazyRadius={0}
            canvasWidth={isMobile ? window.innerWidth - 40 : 800}
            canvasHeight={isMobile ? 300 : 400}
            style={{
              border: 'none',
              borderRadius: '4px'
            }}
          />
        </Box>

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          startIcon={<SaveIcon />}
          sx={{ minWidth: 120 }}
        >
          {initialData.title ? 'Update Note' : 'Save Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HandwrittenNote;
