import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../state/useAppState';

export function SprayArea() {
  const sprayAreaVisible = useAppSelector((state) => state.game.sprayAreaVisible);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const currentWidth = canvas.width;
      const currentHeight = canvas.height;

      // Only resize if dimensions actually changed
      if (rect.width !== currentWidth || rect.height !== currentHeight) {
        // Store the current canvas content
        const imageData = ctx.getImageData(0, 0, currentWidth, currentHeight);

        // Resize canvas
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Restore the content (scaled to new size)
        if (currentWidth > 0 && currentHeight > 0) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startPainting = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default to avoid conflicts
    if (!sprayAreaVisible) return;
    setIsPainting(true);
    paint(e);
  };

  const stopPainting = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    setIsPainting(false);
  };

  const paint = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default to avoid conflicts
    if (!isPainting || !sprayAreaVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Create spray effect with multiple dots
    ctx.fillStyle = '#FF0000';
    ctx.globalAlpha = 0.7;

    for (let i = 0; i < 5; i++) {
      const sprayX = x + (Math.random() - 0.5) * 20;
      const sprayY = y + (Math.random() - 0.5) * 20;
      const size = Math.random() * 4 + 2;

      ctx.beginPath();
      ctx.arc(sprayX, sprayY, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  return (
    <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/20' style={{ zIndex: sprayAreaVisible ? 1000 : -10 }}>
      <img
        className='absolute top-0 left-0 w-full h-full select-none pointer-events-none'
        src='/assets/backgrounds/brick.png'
      />

      <img
        className='absolute h-1/2 select-none pointer-events-none opacity-50'
        src='/assets/tags/z.png'
      />

      <canvas
        ref={canvasRef}
        className='absolute top-0 left-0 w-full h-full cursor-crosshair border border-red-500'
        onMouseDown={startPainting}
        onMouseUp={stopPainting}
        onMouseLeave={stopPainting}
        onMouseMove={paint}
        onTouchStart={startPainting}
        onTouchEnd={stopPainting}
        onTouchMove={paint}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
