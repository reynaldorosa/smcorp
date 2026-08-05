import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Slider } from '@/app/components/ui/slider';
import { Label } from '@/app/components/ui/label';

interface EditorFotoProps {
  imagemOriginal: string;
  onSalvar: (imagemEditada: string) => void;
  onCancelar: () => void;
}

export const EditorFoto: React.FC<EditorFotoProps> = ({ imagemOriginal, onSalvar, onCancelar }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotacao, setRotacao] = useState(0);
  const [posicaoX, setPosicaoX] = useState(0);
  const [posicaoY, setPosicaoY] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [ultimaPosicao, setUltimaPosicao] = useState({ x: 0, y: 0 });

  // Carregar imagem
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImagem(img);
    };
    img.src = imagemOriginal;
  }, [imagemOriginal]);

  // Desenhar no canvas
  useEffect(() => {
    if (!imagem || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tamanhoCanvas = 400;
    canvas.width = tamanhoCanvas;
    canvas.height = tamanhoCanvas;

    // Limpar canvas
    ctx.clearRect(0, 0, tamanhoCanvas, tamanhoCanvas);

    // Salvar estado do contexto
    ctx.save();

    // Aplicar transformações
    ctx.translate(tamanhoCanvas / 2, tamanhoCanvas / 2);
    ctx.rotate((rotacao * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(posicaoX, posicaoY);

    // Desenhar imagem centralizada
    const proporcao = imagem.width / imagem.height;
    let largura = tamanhoCanvas;
    let altura = tamanhoCanvas;

    if (proporcao > 1) {
      altura = tamanhoCanvas / proporcao;
    } else {
      largura = tamanhoCanvas * proporcao;
    }

    ctx.drawImage(imagem, -largura / 2, -altura / 2, largura, altura);

    // Restaurar estado do contexto
    ctx.restore();

    // Desenhar guia circular
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(tamanhoCanvas / 2, tamanhoCanvas / 2, tamanhoCanvas / 2 - 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [imagem, zoom, rotacao, posicaoX, posicaoY]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setArrastando(true);
    setUltimaPosicao({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!arrastando) return;

    const deltaX = e.clientX - ultimaPosicao.x;
    const deltaY = e.clientY - ultimaPosicao.y;

    setPosicaoX(prev => prev + deltaX / zoom);
    setPosicaoY(prev => prev + deltaY / zoom);

    setUltimaPosicao({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setArrastando(false);
  };

  const handleSalvar = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imagem) return;

    // Criar canvas final circular (300x300)
    const canvasFinal = document.createElement('canvas');
    const tamanhoFinal = 300;
    canvasFinal.width = tamanhoFinal;
    canvasFinal.height = tamanhoFinal;
    const ctxFinal = canvasFinal.getContext('2d');
    if (!ctxFinal) return;

    // Desenhar círculo como máscara
    ctxFinal.beginPath();
    ctxFinal.arc(tamanhoFinal / 2, tamanhoFinal / 2, tamanhoFinal / 2, 0, 2 * Math.PI);
    ctxFinal.closePath();
    ctxFinal.clip();

    // Aplicar transformações
    ctxFinal.save();
    ctxFinal.translate(tamanhoFinal / 2, tamanhoFinal / 2);
    ctxFinal.rotate((rotacao * Math.PI) / 180);
    ctxFinal.scale(zoom, zoom);
    ctxFinal.translate(posicaoX, posicaoY);

    // Desenhar imagem
    const proporcao = imagem.width / imagem.height;
    let largura = tamanhoFinal;
    let altura = tamanhoFinal;

    if (proporcao > 1) {
      altura = tamanhoFinal / proporcao;
    } else {
      largura = tamanhoFinal * proporcao;
    }

    ctxFinal.drawImage(imagem, -largura / 2, -altura / 2, largura, altura);
    ctxFinal.restore();

    // Converter para base64
    const imagemEditada = canvasFinal.toDataURL('image/jpeg', 0.9);
    onSalvar(imagemEditada);
  };

  const resetar = () => {
    setZoom(1);
    setRotacao(0);
    setPosicaoX(0);
    setPosicaoY(0);
  };

  return (
    <div className="space-y-6">
      {/* Canvas de Preview */}
      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border-4 border-gray-300 rounded-lg cursor-move shadow-lg"
            style={{ width: '400px', height: '400px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Move className="w-3 h-3" />
            Arraste para mover
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
        {/* Zoom */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-red-600" />
              Zoom: {zoom.toFixed(1)}x
            </Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Slider
            value={[zoom]}
            onValueChange={(value) => setZoom(value[0])}
            min={0.5}
            max={3}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Rotação */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-red-600" />
              Rotação: {rotacao}°
            </Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotacao(prev => prev - 15)}
              >
                -15°
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotacao(prev => prev + 15)}
              >
                +15°
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotacao(prev => prev + 90)}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Slider
            value={[rotacao]}
            onValueChange={(value) => setRotacao(value[0])}
            min={-180}
            max={180}
            step={1}
            className="w-full"
          />
        </div>

        {/* Botões de Reset */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={resetar}
            className="flex-1"
          >
            Resetar Ajustes
          </Button>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 Como usar:</p>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Arraste</strong> a imagem para posicionar</li>
          <li>• Use o <strong>Zoom</strong> para aproximar/afastar</li>
          <li>• Use a <strong>Rotação</strong> para ajustar o ângulo</li>
          <li>• A linha vermelha tracejada mostra a <strong>área de corte circular</strong></li>
        </ul>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button
          onClick={onCancelar}
          variant="outline"
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={handleSalvar}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Check className="w-4 h-4 mr-2" />
          Salvar Foto Ajustada
        </Button>
      </div>
    </div>
  );
};
