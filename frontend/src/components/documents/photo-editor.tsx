'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface PhotoEditorProps {
  /** Original image source (base64 or URL) */
  originalImage: string;
  /** Callback when user saves the edited photo */
  onSave: (editedImage: string) => void;
  /** Callback when user cancels editing */
  onCancel: () => void;
  /** Canvas size in pixels (default: 400) */
  canvasSize?: number;
  /** Output size in pixels (default: 300) */
  outputSize?: number;
  /** Output quality 0-1 (default: 0.9) */
  outputQuality?: number;
  /** Custom class name */
  className?: string;
}

interface EditorState {
  zoom: number;
  rotation: number;
  positionX: number;
  positionY: number;
}

const INITIAL_STATE: EditorState = {
  zoom: 1,
  rotation: 0,
  positionX: 0,
  positionY: 0,
};

// ============================================
// Component
// ============================================

export function PhotoEditor({
  originalImage,
  onSave,
  onCancel,
  canvasSize = 400,
  outputSize = 300,
  outputQuality = 0.9,
  className,
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [state, setState] = useState<EditorState>(INITIAL_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  // Load image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => console.error('Failed to load image');
    img.src = originalImage;
  }, [originalImage]);

  // Draw on canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(canvasSize / 2, canvasSize / 2);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(state.positionX, state.positionY);

    // Calculate dimensions maintaining aspect ratio
    const aspectRatio = image.width / image.height;
    let width = canvasSize;
    let height = canvasSize;

    if (aspectRatio > 1) {
      height = canvasSize / aspectRatio;
    } else {
      width = canvasSize * aspectRatio;
    }

    // Draw centered image
    ctx.drawImage(image, -width / 2, -height / 2, width, height);

    // Restore context
    ctx.restore();

    // Draw circular guide
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [image, state, canvasSize]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastPosition.x;
      const deltaY = e.clientY - lastPosition.y;

      setState((prev) => ({
        ...prev,
        positionX: prev.positionX + deltaX / prev.zoom,
        positionY: prev.positionY + deltaY / prev.zoom,
      }));

      setLastPosition({ x: e.clientX, y: e.clientY });
    },
    [isDragging, lastPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setLastPosition({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDragging) return;
      const touch = e.touches[0];

      const deltaX = touch.clientX - lastPosition.x;
      const deltaY = touch.clientY - lastPosition.y;

      setState((prev) => ({
        ...prev,
        positionX: prev.positionX + deltaX / prev.zoom,
        positionY: prev.positionY + deltaY / prev.zoom,
      }));

      setLastPosition({ x: touch.clientX, y: touch.clientY });
    },
    [isDragging, lastPosition]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Actions
  const handleZoomChange = useCallback((value: number[]) => {
    setState((prev) => ({ ...prev, zoom: value[0] }));
  }, []);

  const handleRotationChange = useCallback((value: number[]) => {
    setState((prev) => ({ ...prev, rotation: value[0] }));
  }, []);

  const adjustZoom = useCallback((delta: number) => {
    setState((prev) => ({
      ...prev,
      zoom: Math.min(3, Math.max(0.5, prev.zoom + delta)),
    }));
  }, []);

  const adjustRotation = useCallback((delta: number) => {
    setState((prev) => ({ ...prev, rotation: prev.rotation + delta }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const handleSave = useCallback(() => {
    if (!canvasRef.current || !image) return;

    // Create final canvas with circular mask
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = outputSize;
    finalCanvas.height = outputSize;
    const ctxFinal = finalCanvas.getContext('2d');
    if (!ctxFinal) return;

    // Create circular clipping mask
    ctxFinal.beginPath();
    ctxFinal.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI);
    ctxFinal.closePath();
    ctxFinal.clip();

    // Apply transformations
    ctxFinal.save();
    ctxFinal.translate(outputSize / 2, outputSize / 2);
    ctxFinal.rotate((state.rotation * Math.PI) / 180);
    ctxFinal.scale(state.zoom, state.zoom);
    ctxFinal.translate(state.positionX, state.positionY);

    // Calculate dimensions
    const aspectRatio = image.width / image.height;
    let width = outputSize;
    let height = outputSize;

    if (aspectRatio > 1) {
      height = outputSize / aspectRatio;
    } else {
      width = outputSize * aspectRatio;
    }

    // Draw image
    ctxFinal.drawImage(image, -width / 2, -height / 2, width, height);
    ctxFinal.restore();

    // Convert to base64
    const editedImage = finalCanvas.toDataURL('image/jpeg', outputQuality);
    onSave(editedImage);
  }, [image, state, outputSize, outputQuality, onSave]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Canvas Preview */}
      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border-4 border-muted rounded-lg cursor-move shadow-lg"
            style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
            <Move className="w-3 h-3" />
            Arraste para mover
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 bg-muted/50 p-4 rounded-lg border">
        {/* Zoom */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-primary" />
              Zoom: {state.zoom.toFixed(1)}x
            </Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustZoom(-0.1)}
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustZoom(0.1)}
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Slider
            value={[state.zoom]}
            onValueChange={handleZoomChange}
            min={0.5}
            max={3}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Rotation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-primary" />
              Rotation: {state.rotation}°
            </Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustRotation(-15)}
              >
                -15°
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustRotation(15)}
              >
                +15°
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustRotation(90)}
                aria-label="Rotate 90 degrees"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Slider
            value={[state.rotation]}
            onValueChange={handleRotationChange}
            min={-180}
            max={180}
            step={1}
            className="w-full"
          />
        </div>

        {/* Reset Button */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={reset} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Resetar Ajustes
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
        <p className="font-semibold mb-1">💡 Como usar:</p>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Arraste</strong> a imagem para posicioná-la</li>
          <li>• Use o <strong>Zoom</strong> para aumentar/diminuir</li>
          <li>• Use a <strong>Rotação</strong> para ajustar o ângulo</li>
          <li>• A linha vermelha pontilhada mostra a <strong>área de corte circular</strong></li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
          <Check className="w-4 h-4 mr-2" />
          Salvar Foto
        </Button>
      </div>
    </div>
  );
}

export default PhotoEditor;
