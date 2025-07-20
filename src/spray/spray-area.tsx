import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useAppSelector } from '../state/useAppState';

export type SprayAreaRef = {
  reset: () => void;
}

export const SprayArea = forwardRef<SprayAreaRef>((_, ref) => {
  const sprayAreaVisible = useAppSelector((state) => state.game.sprayAreaVisible);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [overlapPercentage, setOverlapPercentage] = useState(0);
  const throttledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      resetCanvas();
    },
  }));

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

  // Load and process the tag image
  useEffect(() => {
    const tagCanvas = tagCanvasRef.current;
    if (!tagCanvas) return;

    const tagCtx = tagCanvas.getContext('2d');
    if (!tagCtx) return;

    const tagImg = new Image();
    tagImg.onload = () => {
      // Set tag canvas size to match the main canvas
      const mainCanvas = canvasRef.current;
      if (!mainCanvas) return;

      const rect = mainCanvas.getBoundingClientRect();
      tagCanvas.width = rect.width;
      tagCanvas.height = rect.height;

      // Clear the tag canvas
      tagCtx.clearRect(0, 0, tagCanvas.width, tagCanvas.height);

      // Calculate tag position to center it and make it half height
      const tagAspectRatio = tagImg.width / tagImg.height;
      const tagHeight = rect.height / 2;
      const tagWidth = tagHeight * tagAspectRatio;
      const tagX = (rect.width - tagWidth) / 2;
      const tagY = (rect.height - tagHeight) / 2;

      // Draw the tag image
      tagCtx.drawImage(tagImg, tagX, tagY, tagWidth, tagHeight);
    };
    tagImg.src = '/assets/tags/z.png';
  }, []);

  const calculateOverlap = () => {
    const canvas = canvasRef.current;
    const tagCanvas = tagCanvasRef.current;
    if (!canvas || !tagCanvas) return;

    const ctx = canvas.getContext('2d');
    const tagCtx = tagCanvas.getContext('2d');
    if (!ctx || !tagCtx) return;

    // Get image data from both canvases
    const paintedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tagData = tagCtx.getImageData(0, 0, tagCanvas.width, tagCanvas.height);

    let overlappingPixels = 0;
    let tagPixels = 0;

    // Compare pixels
    for (let i = 0; i < paintedData.data.length; i += 4) {
      const paintedRed = paintedData.data[i];
      const paintedGreen = paintedData.data[i + 1];
      const paintedBlue = paintedData.data[i + 2];
      const paintedAlpha = paintedData.data[i + 3];

      const tagAlpha = tagData.data[i + 3];

      // Check if pixel is painted (red with some alpha)
      const isPainted = paintedRed > 100 && paintedGreen < 50 && paintedBlue < 50 && paintedAlpha > 50;

      // Check if pixel is part of the tag (non-transparent)
      const isTagPixel = tagAlpha > 50;

      if (isPainted && isTagPixel) {
        overlappingPixels++;
      }

      if (isTagPixel) {
        tagPixels++;
      }
    }

    // Calculate overlap percentage
    const overlapPercentage = tagPixels > 0 ? (overlappingPixels / tagPixels) * 100 : 0;
    setOverlapPercentage(Math.round(overlapPercentage));
  };

  const throttledCalculateOverlap = () => {
    // Clear existing timeout
    if (throttledTimeoutRef.current) {
      return;;
    }

    // Set new timeout
    throttledTimeoutRef.current = setTimeout(() => {
      calculateOverlap();
      throttledTimeoutRef.current = null;
    }, 100);
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset overlap percentage
    setOverlapPercentage(0);
  };

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

    for (let i = 0; i < 8; i++) {
      const sprayX = x + (Math.random() - 0.5) * 40;
      const sprayY = y + (Math.random() - 0.5) * 40;
      const size = Math.random() * 8 + 4;

      ctx.beginPath();
      ctx.arc(sprayX, sprayY, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    throttledCalculateOverlap();
  };

  return (
    <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center' style={{ zIndex: sprayAreaVisible ? 1000 : -10 }}>
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

      {/* Hidden canvas for tag processing */}
      <canvas
        ref={tagCanvasRef}
        style={{ display: 'none' }}
      />

      {/* Overlap display and reset button */}
      {sprayAreaVisible && (
        <div className='absolute top-4 right-4 flex flex-col gap-2'>
          <div className='bg-black/70 text-white px-3 py-2 rounded-lg font-mono text-sm'>
            Overlap: {overlapPercentage}%
          </div>
        </div>
      )}
    </div>
  );
});
