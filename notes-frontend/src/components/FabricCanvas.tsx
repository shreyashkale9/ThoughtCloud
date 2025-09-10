import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Slider, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Palette, Undo, Clear, ShapeLineOutlined, TextFields } from '@mui/icons-material';

// Note: You would need to install fabric.js: npm install fabric
// import { fabric } from 'fabric';

interface FabricCanvasProps {
  width?: number;
  height?: number;
  onSave?: (data: string) => void;
  initialData?: string;
}

const FabricCanvas: React.FC<FabricCanvasProps> = ({ 
  width = 600, 
  height = 400, 
  onSave, 
  initialData 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [drawingMode, setDrawingMode] = useState('brush');

  useEffect(() => {
    // Initialize Fabric.js canvas
    // const canvas = new fabric.Canvas(canvasRef.current, {
    //   width: width,
    //   height: height,
    //   backgroundColor: 'white'
    // });
    
    // fabricCanvasRef.current = canvas;

    // // Set up drawing mode
    // canvas.isDrawingMode = true;
    // canvas.freeDrawingBrush.color = brushColor;
    // canvas.freeDrawingBrush.width = brushSize;

    // // Load initial data if provided
    // if (initialData) {
    //   canvas.loadFromJSON(initialData, () => {
    //     canvas.renderAll();
    //   });
    // }

    // return () => {
    //   canvas.dispose();
    // };
  }, [width, height, initialData]);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
    }
  }, [brushColor, brushSize]);

  const undo = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.undo();
    }
  };

  const clear = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
    }
  };

  const addText = () => {
    // Requires fabric.js installation: npm install fabric
    // if (fabricCanvasRef.current) {
    //   const text = new fabric.Text('Click to edit', {
    //     left: 100,
    //     top: 100,
    //     fontSize: 20,
    //     fill: brushColor
    //   });
    //   fabricCanvasRef.current.add(text);
    // }
    console.log('Text tool - requires fabric.js');
  };

  const addShape = () => {
    // Requires fabric.js installation: npm install fabric
    // if (fabricCanvasRef.current) {
    //   const rect = new fabric.Rect({
    //     left: 100,
    //     top: 100,
    //     width: 100,
    //     height: 100,
    //     fill: 'transparent',
    //     stroke: brushColor,
    //     strokeWidth: brushSize
    //   });
    //   fabricCanvasRef.current.add(rect);
    // }
    console.log('Shape tool - requires fabric.js');
  };

  const handleSave = () => {
    if (fabricCanvasRef.current && onSave) {
      const data = JSON.stringify(fabricCanvasRef.current.toJSON());
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

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tool</InputLabel>
          <Select
            value={drawingMode}
            label="Tool"
            onChange={(e) => setDrawingMode(e.target.value)}
          >
            <MenuItem value="brush">Brush</MenuItem>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="shape">Shape</MenuItem>
          </Select>
        </FormControl>

        <IconButton onClick={undo}>
          <Undo />
        </IconButton>
        
        <IconButton onClick={clear}>
          <Clear />
        </IconButton>

        <IconButton onClick={addText}>
          <TextFields />
        </IconButton>

        <IconButton onClick={addShape}>
          <ShapeLineOutlined />
        </IconButton>

        <Button variant="contained" onClick={handleSave}>
          Save Drawing
        </Button>
      </Box>

      {/* Canvas */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <canvas
          ref={canvasRef}
          style={{
            borderRadius: 4
          }}
        />
      </Box>
    </Box>
  );
};

export default FabricCanvas;
