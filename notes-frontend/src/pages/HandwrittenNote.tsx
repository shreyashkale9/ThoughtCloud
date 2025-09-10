import React, { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, TextField, IconButton, Tooltip, Divider,
  Slider, Alert, Snackbar, AppBar, Toolbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import BrushIcon from '@mui/icons-material/Brush';
import EraserIcon from '@mui/icons-material/FormatColorReset';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ClearIcon from '@mui/icons-material/Clear';
import PaletteIcon from '@mui/icons-material/Palette';
import AddIcon from '@mui/icons-material/Add';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DeleteIcon from '@mui/icons-material/Delete';

// Declare window property for TypeScript
declare global {
  interface Window {
    CanvasDrawPreloaded?: boolean;
  }
}

// Optimized lazy loading with preloading
const CanvasDraw = lazy(() => 
  import('react-canvas-draw').then(module => {
    // Preload the component for faster subsequent loads
    if (typeof window !== 'undefined') {
      window.CanvasDrawPreloaded = true;
    }
    return { default: module.default };
  })
);

// Preload CanvasDraw component
if (typeof window !== 'undefined' && !window.CanvasDrawPreloaded) {
  import('react-canvas-draw');
}

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

const HandwrittenNote: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State management
  const [, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Drawing tools state
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Multi-page state
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<string[]>([]); // Array of canvas data for each page - start empty
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1900, height: 1200 });
  const [lastLoadedData, setLastLoadedData] = useState<string>(''); // Track last loaded data to prevent unnecessary reloads
  
  const canvasRef = useRef<any>(null);

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

  // Optimize canvas data by cleaning up empty or invalid data
  const optimizeCanvasData = useCallback((data: string) => {
    if (!data || data.trim() === '') {
      return JSON.stringify({lines: [], width: canvasDimensions.width, height: canvasDimensions.height});
    }
    
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && parsed.lines && Array.isArray(parsed.lines)) {
        // Remove empty lines to reduce data size
        const cleanedLines = parsed.lines.filter((line: any) => 
          line && line.points && Array.isArray(line.points) && line.points.length > 0
        );
        
        return JSON.stringify({
          ...parsed,
          lines: cleanedLines
        });
      }
    } catch (error) {
      console.warn('Invalid canvas data, using empty canvas:', error);
    }
    
    return JSON.stringify({lines: [], width: canvasDimensions.width, height: canvasDimensions.height});
  }, [canvasDimensions]);

  // Save current page data to pages array
  const saveCurrentPageData = useCallback(() => {
    if (canvasRef.current) {
      const currentData = canvasRef.current.getSaveData();
      console.log('Saving current page data for page', currentPage, ':', currentData.length);
      
      setPages(prev => {
        const newPages = [...prev];
        newPages[currentPage] = optimizeCanvasData(currentData);
        return newPages;
      });
    }
  }, [currentPage, optimizeCanvasData]);

  // Page management functions with debouncing to prevent rapid calls
  const addNewPage = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Limit maximum pages to prevent memory issues
    if (pages.length >= 50) {
      setError('Maximum 50 pages allowed per note');
      return;
    }
    
    // Save current page data first
    saveCurrentPageData();
    
    // Add new empty page
    setPages(prev => {
      const newPages = [...prev];
      // Add empty page with valid canvas structure
      const emptyCanvasData = JSON.stringify({lines: [], width: canvasDimensions.width, height: canvasDimensions.height});
      newPages.push(emptyCanvasData);
      return newPages;
    });
    
    setCurrentPage(prev => prev + 1);
    setLastLoadedData('EMPTY_PAGE'); // Use a special marker for empty pages
  }, [canvasDimensions, pages.length, saveCurrentPageData]);

  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= pages.length || pageIndex === currentPage) {
      return; // Prevent unnecessary operations
    }
    
    console.log('Switching from page', currentPage, 'to page', pageIndex);
    console.log('Current pages state:', pages.map((page, index) => ({
      pageIndex: index,
      hasData: page && page.trim() !== '',
      dataLength: page ? page.length : 0
    })));
    
    // Save current page data first, then switch pages
    if (canvasRef.current) {
      const currentData = canvasRef.current.getSaveData();
      console.log('Saving current page data before switching:', currentData.length);
      
      // Use functional update to ensure we have the latest pages state
      setPages(prevPages => {
        const updatedPages = [...prevPages];
        updatedPages[currentPage] = optimizeCanvasData(currentData);
        console.log('Updated pages after saving current page:', updatedPages.map((page, index) => ({
          pageIndex: index,
          hasData: page && page.trim() !== '',
          dataLength: page ? page.length : 0
        })));
        return updatedPages;
      });
      
      // Clear canvas immediately to prevent data mixing
      canvasRef.current.clear();
      
      // Switch to the new page
      setCurrentPage(pageIndex);
      setLastLoadedData('PAGE_CHANGED'); // Reset to force reload of new page
    } else {
      // If no canvas ref, just switch pages
      setCurrentPage(pageIndex);
      setLastLoadedData('PAGE_CHANGED');
    }
  }, [currentPage, pages.length, optimizeCanvasData]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCurrentPage = useCallback(() => {
    if (pages.length <= 1) return; // Prevent deleting the last page
    
    const newPages = pages.filter((_, index) => index !== currentPage);
    setPages(newPages);
    
    // Adjust current page if necessary
    const newCurrentPage = currentPage >= newPages.length ? newPages.length - 1 : currentPage;
    setCurrentPage(newCurrentPage);
    setLastLoadedData('PAGE_DELETED'); // Reset to force reload
  }, [currentPage, pages]);

  // Optimize canvas dimensions based on viewport
  const updateCanvasDimensions = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate optimal canvas size (full width with 5px margin)
    const availableWidth = viewportWidth - 10; // 5px margin on each side
    const availableHeight = viewportHeight - 150; // Space for toolbar and controls
    
    // Use 16:10 aspect ratio for better drawing experience
    const aspectRatio = 16 / 10;
    let canvasWidth = availableWidth;
    let canvasHeight = canvasWidth / aspectRatio;
    
    if (canvasHeight > availableHeight) {
      canvasHeight = availableHeight;
      canvasWidth = canvasHeight * aspectRatio;
    }
    
    // Ensure minimum size
    canvasWidth = Math.max(canvasWidth, 1000);
    canvasHeight = Math.max(canvasHeight, 625);
    
    setCanvasDimensions({ width: canvasWidth, height: canvasHeight });
  }, []);

  // Debounced save function to prevent excessive saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSave = useCallback(async () => {
    if (!token || saving) return;
    
    setSaving(true);
    try {
      // Get current canvas data
      let currentCanvasData = '';
      if (canvasRef.current) {
        currentCanvasData = canvasRef.current.getSaveData();
        console.log('Current canvas data length:', currentCanvasData.length);
      }
      
      // Update pages with current canvas data (optimized)
      const updatedPages = [...pages];
      updatedPages[currentPage] = optimizeCanvasData(currentCanvasData);
      
      console.log('Saving pages:', updatedPages.map((page, index) => ({
        page: index,
        dataLength: page ? page.length : 0,
        hasData: page && page.trim() !== ''
      })));
      
      // Save all pages data
      const allPagesData = JSON.stringify(updatedPages);
      console.log('Saving all pages data length:', allPagesData.length);
      
      const noteData = {
        title: title || 'Untitled Handwritten Note',
        content: 'Handwritten Note',
        type: 'handwritten',
        drawingData: allPagesData, // Store all pages as JSON
        folder: folder,
        tags: tags
      };

      if (id && id !== 'new') {
        // Update existing note
        console.log('Updating existing note:', id);
        await api.put(`/notes/${id}`, noteData, token);
      } else {
        // Create new note
        console.log('Creating new note');
        await api.post('/notes', noteData, token);
      }

      setSuccess('Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note');
    } finally {
      setSaving(false);
    }
  }, [token, title, folder, tags, id, pages, currentPage, saving, optimizeCanvasData]);

  // Memoized predefined colors for better performance
  const predefinedColors = useMemo(() => [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ], []);

  // Load note data
  useEffect(() => {
    const loadNote = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        if (id && id !== 'new') {
          // Loading existing note
          const noteData = await api.get(`/notes/${id}`, token);
          setNote(noteData);
          setTitle(noteData.title || '');
          setFolder(noteData.folder || '');
          setTags(noteData.tags || []);
          
          // Load multi-page data
          if (noteData.drawingData) {
            console.log('Raw drawing data:', noteData.drawingData.substring(0, 200) + '...');
            try {
              const pagesData = JSON.parse(noteData.drawingData);
              console.log('Parsed pages data:', pagesData);
              if (Array.isArray(pagesData) && pagesData.length > 0) {
                setPages(pagesData);
                setCurrentPage(0);
                setLastLoadedData('INITIAL_LOAD'); // Reset to force initial load
                console.log('Set pages to:', pagesData);
              } else {
                // Empty array case
                const emptyCanvasData = JSON.stringify({lines: [], width: canvasDimensions.width, height: canvasDimensions.height});
                setPages([emptyCanvasData]);
                setCurrentPage(0);
                setLastLoadedData('INITIAL_LOAD'); // Reset to force initial load
                console.log('Empty array, set to empty page');
              }
            } catch (e) {
              // Fallback for old single-page format
              console.log('Loading old format note:', noteData.drawingData.substring(0, 100) + '...');
              setPages([noteData.drawingData]);
              setCurrentPage(0);
              setLastLoadedData(''); // Reset to force initial load
              console.log('Set pages to old format:', [noteData.drawingData]);
            }
          } else {
            // No drawing data
            console.log('No drawing data found');
            const emptyCanvasData = JSON.stringify({lines: [], width: canvasDimensions.width, height: canvasDimensions.height});
            setPages([emptyCanvasData]);
            setCurrentPage(0);
            setLastLoadedData('INITIAL_LOAD'); // Reset to force initial load
          }
        } else {
          // Creating new note
          setNote({
            _id: 'temp',
            title: '',
            content: 'Handwritten Note',
            type: 'handwritten',
            drawingData: '',
            folder: '',
            tags: []
          });
          setTitle('');
          setFolder('');
          setTags([]);
          const emptyCanvasData = JSON.stringify({lines: [], width: canvasDimensions.width, height: canvasDimensions.height});
          setPages([emptyCanvasData]);
          setCurrentPage(0);
        }
      } catch (error) {
        console.error('Error loading note:', error);
        setError('Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [id, token, navigate, canvasDimensions]);

  // Viewport optimization
  useEffect(() => {
    updateCanvasDimensions();
    
    const handleResize = () => {
      updateCanvasDimensions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasDimensions]);

  // Disable auto-save to prevent loading loops
  // Auto-save will be handled manually when needed

  // Load current page data when page changes or canvas is ready
  useEffect(() => {
    if (!canvasRef.current || pages.length === 0 || loading) {
      return;
    }

    const currentPageData = pages[currentPage];
    
    // If currentPage is out of bounds, don't load anything
    if (currentPage >= pages.length) {
      console.log('Current page out of bounds, not loading');
      return;
    }
    
    // Only reload if the data has actually changed
    if (currentPageData === lastLoadedData) {
      return;
    }
    
    console.log('Loading page data:', {
      currentPage,
      totalPages: pages.length,
      hasData: currentPageData && currentPageData.trim() !== '',
      dataLength: currentPageData ? currentPageData.length : 0,
      dataChanged: currentPageData !== lastLoadedData,
      pagesData: pages.map((page, index) => ({
        pageIndex: index,
        hasData: page && page.trim() !== '',
        dataLength: page ? page.length : 0
      }))
    });
    
    // Direct loading for faster performance
    try {
      // Double-check that we're still on the same page (prevent race conditions)
      if (pages[currentPage] !== currentPageData) {
        console.log('Page changed during loading, aborting');
        return;
      }
      
      if (currentPageData && currentPageData.trim() !== '' && currentPageData !== '""' && currentPageData !== '[]') {
        // Validate canvas data structure before loading
        const parsedData = JSON.parse(currentPageData);
        if (parsedData && typeof parsedData === 'object' && parsedData.lines && Array.isArray(parsedData.lines)) {
          // Data looks valid, load it
          if (canvasRef.current) {
            console.log('Loading canvas data for page', currentPage);
            
            // Clear canvas first to ensure clean state
            canvasRef.current.clear();
            
            // Load the new data immediately
            canvasRef.current.loadSaveData(currentPageData, true);
            console.log('Canvas data loaded successfully for page', currentPage);
            setLastLoadedData(currentPageData);
          }
        } else {
          console.error('Invalid canvas data structure:', parsedData);
          if (canvasRef.current) {
            canvasRef.current.clear();
            setLastLoadedData('EMPTY_PAGE');
          }
        }
      } else {
        // Clear canvas for empty page
        if (canvasRef.current) {
          canvasRef.current.clear();
          console.log('Canvas cleared for empty page', currentPage);
          setLastLoadedData('EMPTY_PAGE');
        }
      }
    } catch (error) {
      console.error('Error loading canvas data for page', currentPage, ':', error);
      if (canvasRef.current) {
        canvasRef.current.clear();
        setLastLoadedData('EMPTY_PAGE');
      }
    }
  }, [currentPage, pages, loading, lastLoadedData]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcuts for premium experience
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default for our shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSave();
            break;
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
          case 'n':
            event.preventDefault();
            addNewPage();
            break;
        }
      }
      
      // Page navigation shortcuts
      if (event.altKey) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (currentPage > 0) goToPage(currentPage - 1);
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (currentPage < pages.length - 1) goToPage(currentPage + 1);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBrushTool, handleEraserTool, handleUndo, handleSave, addNewPage, goToPage, currentPage, pages.length]);

  // Handle tag input
  const handleTagInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const value = event.currentTarget.value.trim();
      if (value && !tags.includes(value)) {
        setTags([...tags, value]);
        event.currentTarget.value = '';
      }
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <AppBar position="static" sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <TextField
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            variant="outlined"
            size="small"
            sx={{ 
              flexGrow: 1, 
              mr: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.default'
              }
            }}
          />

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ mr: 2 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawing Tools Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        flexWrap: 'wrap',
        minHeight: 'auto'
      }}>
        {/* Tool Selection */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Brush (Ctrl+B)">
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
          <Tooltip title="Eraser (Ctrl+E)">
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 120 }}>
          <Typography variant="body2" sx={{ minWidth: 50 }}>
            Size:
          </Typography>
          <Slider
            value={brushSize}
            onChange={(_, value) => setBrushSize(value as number)}
            min={1}
            max={30}
            step={1}
            size="small"
            sx={{ width: 100 }}
          />
          <Typography variant="body2" sx={{ minWidth: 30 }}>
            {brushSize}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Color Selection */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                <PaletteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Undo (Ctrl+Z)">
            <IconButton onClick={handleUndo} size="small">
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo (Not supported)">
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

        {/* Page Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
          <Tooltip title="Previous Page (Alt+←)">
            <span>
              <IconButton 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                size="small"
              >
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
            {currentPage + 1} / {pages.length}
          </Typography>
          
          <Tooltip title="Next Page (Alt+→)">
            <span>
              <IconButton 
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pages.length - 1}
                size="small"
              >
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          {/* Add New Page Button */}
          <Tooltip title="Add New Page">
            <IconButton 
              onClick={addNewPage}
              size="small"
              color="primary"
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {pages.length > 1 && (
            <Tooltip title="Delete Current Page">
              <IconButton 
                onClick={deleteCurrentPage}
                size="small"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Keyboard Shortcuts Info */}
        <Typography variant="caption" sx={{ 
          color: 'text.secondary', 
          fontSize: '0.7rem',
          ml: 'auto'
        }}>
          💡 Ctrl+S (Save), Ctrl+N (New Page), Alt+←/→ (Navigate), Ctrl+Z (Undo)
        </Typography>
      </Box>

      {/* Custom Color Picker */}
      {showColorPicker && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
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

      {/* Folder and Tags */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <TextField
          label="Folder"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="Add Tag"
          size="small"
          onKeyDown={handleTagInput}
          placeholder="Press Enter to add tag"
          sx={{ minWidth: 200 }}
        />
        {tags.map((tag) => (
          <Box
            key={tag}
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {tag}
            <IconButton
              size="small"
              onClick={() => removeTag(tag)}
              sx={{ color: 'inherit', p: 0.25 }}
            >
              ×
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Main Canvas Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        p: 2,
        overflow: 'auto'
      }}>
        <Box sx={{ 
          border: 2, 
          borderColor: 'divider', 
          borderRadius: 2,
          backgroundColor: 'white',
          boxShadow: 2,
          position: 'relative'
        }}>
          {/* Page indicator overlay */}
          <Box sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            zIndex: 10
          }}>
            Page {currentPage + 1} of {pages.length}
          </Box>
          
          {/* Debug info overlay */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.6rem',
              zIndex: 10,
              maxWidth: 200
            }}>
              Data: {pages[currentPage] ? pages[currentPage].length + ' chars' : 'empty'}
              <br />
              Loading: {loading ? 'Yes' : 'No'}
            </Box>
          )}
          
          <Suspense fallback={
            <Box sx={{ 
              width: `${canvasDimensions.width}px`, 
              height: `${canvasDimensions.height}px`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 2
            }}>
              <Typography variant="h6" color="text.secondary">
                Loading canvas...
              </Typography>
            </Box>
          }>
            <CanvasDraw
              key={`canvas-page-${currentPage}`} // Force re-render when page changes
              ref={canvasRef}
              brushColor={brushColor}
              brushRadius={brushSize}
              lazyRadius={0}
              canvasWidth={canvasDimensions.width}
              canvasHeight={canvasDimensions.height}
              saveData={pages[currentPage] || JSON.stringify({lines: [], width: canvasDimensions.width, height: canvasDimensions.height})}
              style={{
                border: 'none',
                borderRadius: '8px',
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`
              }}
            />
          </Suspense>
        </Box>
      </Box>


      {/* Error and Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HandwrittenNote;
