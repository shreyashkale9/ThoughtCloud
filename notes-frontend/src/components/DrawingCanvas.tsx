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
  useMediaQuery,
  Switch,
  FormControlLabel
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
 * Interface for drawing data
 */
interface DrawingData {
  title: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  canvasData: string;
  width: number;
  height: number;
}

/**
 * Props for DrawingCanvas component
 */
interface DrawingCanvasProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DrawingData) => void;
  initialData?: Partial<DrawingData>;
}

/**
 * Drawing canvas component for creating and editing drawings
 */
const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  open,
  onClose,
  onSave,
  initialData = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const canvasRef = useRef<CanvasDraw>(null);
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [tags, setTags] = useState(initialData.tags?.join(', ') || '');
  const [isPublic, setIsPublic] = useState(initialData.isPublic || false);
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

    const canvasData = canvasRef.current.getSaveData();
    
    // Check if canvas has any content
    if (!canvasData || canvasData === '[]') {
      setError('Please draw something before saving');
      return;
    }

    const drawingData: DrawingData = {
      title: title.trim(),
      description: description.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isPublic,
      canvasData,
      width: isMobile ? window.innerWidth - 40 : 800,
      height: isMobile ? 400 : 600
    };

    onSave(drawingData);
    handleClose();
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setIsPublic(false);
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
   * Load initial canvas data if editing
   */
  React.useEffect(() => {
    if (open && initialData.canvasData && canvasRef.current) {
      canvasRef.current.loadSaveData(initialData.canvasData, true);
    }
  }, [open, initialData.canvasData]);

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
            🎨 {initialData.title ? 'Edit Drawing' : 'New Drawing'}
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
        {/* Drawing Details */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ flex: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                color="primary"
              />
            }
            label="Public"
            sx={{ flex: 0 }}
          />
        </Box>

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your drawing..."
        />

        <TextField
          label="Tags (comma separated)"
          fullWidth
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="art, sketch, doodle"
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
                <MenuItem value={30}>30px</MenuItem>
                <MenuItem value={40}>40px</MenuItem>
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
            canvasHeight={isMobile ? 400 : 600}
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
          {initialData.title ? 'Update Drawing' : 'Save Drawing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DrawingCanvas;
