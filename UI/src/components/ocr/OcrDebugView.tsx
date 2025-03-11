import React, { useRef, useEffect } from 'react';

interface TextRegion {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface OcrDebugViewProps {
  imageUrl: string;
  regions: TextRegion[];
  ingredients?: TextRegion;
}

export const OcrDebugView: React.FC<OcrDebugViewProps> = ({
  imageUrl,
  regions,
  ingredients,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Draw image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw all regions
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 1;
      regions.forEach((region) => {
        const { x0, y0, x1, y1 } = region.bbox;
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      });

      // Highlight ingredients region
      if (ingredients) {
        const { x0, y0, x1, y1 } = ingredients.bbox;
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, regions, ingredients]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="max-w-full h-auto border rounded" />
    </div>
  );
};
