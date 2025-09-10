import React, { useState, useRef } from 'react';
import { Box, IconButton, Slider, Button } from '@mui/material';
import { Palette, Undo, Clear } from '@mui/icons-material';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface SVGDrawingProps {
  width?: number;
  height?: number;
  onSave?: (data: string) => void;
  initialData?: string;
}

const SVGDrawing: React.FC<SVGDrawingProps> = ({ 
  width = 600, 
  height = 400, 
  onSave, 
  initialData 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const startDrawing = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDrawing(true);
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentStroke([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentStroke(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      const newStroke: Stroke = {
        points: [...currentStroke],
        color: brushColor,
        width: brushSize
      };
      
      const newStrokes = [...strokes, newStroke];
      setStrokes(newStrokes);
      setCurrentStroke([]);
      setIsDrawing(false);
      
      // Save to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...newStrokes]);
      setHistory(newHistory);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setStrokes(history[historyIndex - 1]);
    }
  };

  const clear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const getSVGData = () => {
    if (!svgRef.current) return '';
    return new XMLSerializer().serializeToString(svgRef.current);
  };

  const handleSave = () => {
    const data = getSVGData();
    if (onSave) {
      onSave(data);
    }
  };

  const createPath = (points: Point[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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

        <IconButton onClick={undo} disabled={historyIndex <= 0}>
          <Undo />
        </IconButton>
        
        <IconButton onClick={clear}>
          <Clear />
        </IconButton>

        <Button variant="contained" onClick={handleSave}>
          Save Drawing
        </Button>
      </Box>

      {/* SVG Canvas */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            cursor: 'crosshair',
            backgroundColor: 'white',
            borderRadius: 4
          }}
        >
          {/* Render completed strokes */}
          {strokes.map((stroke, index) => (
            <path
              key={index}
              d={createPath(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          
          {/* Render current stroke */}
          {isDrawing && currentStroke.length > 0 && (
            <path
              d={createPath(currentStroke)}
              stroke={brushColor}
              strokeWidth={brushSize}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </Box>
    </Box>
  );
};

export default SVGDrawing;
