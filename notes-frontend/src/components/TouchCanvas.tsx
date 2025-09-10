import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Slider, Button } from '@mui/material';
import { Palette, Undo, Clear } from '@mui/icons-material';

interface TouchCanvasProps {
  width?: number;
  height?: number;
  onSave?: (data: string) => void;
  initialData?: string;
}

const TouchCanvas: React.FC<TouchCanvasProps> = ({ 
  width = 600, 
  height = 400, 
  onSave, 
  initialData 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set default styles
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        saveState();
      };
      img.src = initialData;
    } else {
      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      saveState();
    }
  }, [width, height, initialData]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  };

  const getPoint = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getPoint(e);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setHistoryIndex(historyIndex - 1);
      ctx.putImageData(history[historyIndex - 1], 0, 0);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getImageData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL();
  };

  const handleSave = () => {
    const data = getImageData();
    if (onSave) {
      onSave(data);
    }
  };

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          style={{ width: 40, height: 40, border: 'none', borderRadius: 4 }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
          <span>Size:</span>
          <Slider
            value={brushSize}
            onChange={(_, value) => setBrushSize(value as number)}
            min={1}
            max={20}
            sx={{ width: 100 }}
          />
          <span>{brushSize}px</span>
        </Box>

        <IconButton onClick={undo} disabled={historyIndex <= 0} size="large">
          <Undo />
        </IconButton>
        
        <IconButton onClick={clear} size="large">
          <Clear />
        </IconButton>

        <Button variant="contained" onClick={handleSave} size="large">
          Save Drawing
        </Button>
      </Box>

      {/* Canvas */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            cursor: 'crosshair',
            display: 'block',
            borderRadius: 4,
            touchAction: 'none' // Prevent scrolling while drawing
          }}
        />
      </Box>
    </Box>
  );
};

export default TouchCanvas;
