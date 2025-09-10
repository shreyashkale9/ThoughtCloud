declare module 'react-canvas-draw' {
  import { Component } from 'react';

  interface CanvasDrawProps {
    brushColor?: string;
    brushRadius?: number;
    lazyRadius?: number;
    canvasWidth?: number;
    canvasHeight?: number;
    disabled?: boolean;
    saveData?: string;
    style?: React.CSSProperties;
    className?: string;
    ref?: React.Ref<CanvasDraw>;
  }

  interface CanvasDrawRef {
    getSaveData(): string;
    loadSaveData(saveData: string, immediate?: boolean): void;
    clear(): void;
    undo(): void;
  }

  export default class CanvasDraw extends Component<CanvasDrawProps> {
    getSaveData(): string;
    loadSaveData(saveData: string, immediate?: boolean): void;
    clear(): void;
    undo(): void;
  }
}
