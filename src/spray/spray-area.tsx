import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useGame } from '../state/game-context';
import { gameActions } from '../state/gameSlice';
import { useAppDispatch, useAppSelector } from '../state/useAppState';

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
  const { gameInstance } = useGame();

  const sprayColor = useAppSelector((state) => state.data.sprayColor);

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
      const tagHeight = rect.height / 3;
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
      const paintedAlpha = paintedData.data[i + 3];
      const tagAlpha = tagData.data[i + 3];
      const isPainted = paintedAlpha > 50;
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

    if (overlapPercentage >= 85) {
      onSprayComplete();
    }
  };

  const throttledCalculateOverlap = () => {
    // Clear existing timeout
    if (throttledTimeoutRef.current) {
      return;
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

    // Reset completion flag
    hasCompletedSprayCan.current = false;
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
    ctx.fillStyle = sprayColor;
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

  const activeSprayCanId = useAppSelector((state) => state.game.activeSprayCanId);
  const dispatch = useAppDispatch();
  const [sprayComplete, setSprayComplete] = useState(false);
  const sprayCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedSprayCan = useRef(false);

  const onSprayComplete = () => {
    // Prevent multiple completions for the same spray can
    if (hasCompletedSprayCan.current) {
      return;
    }

    hasCompletedSprayCan.current = true;

    if (gameInstance.current && activeSprayCanId != null) {
      gameInstance.current.completeSprayCan(activeSprayCanId);
    }
    dispatch(gameActions.completeSprayCan());
    setSprayComplete(true);

    // Clear any existing timeout
    if (sprayCompleteTimeoutRef.current) {
      clearTimeout(sprayCompleteTimeoutRef.current);
    }

    sprayCompleteTimeoutRef.current = setTimeout(() => {
      dispatch(gameActions.setSprayAreaVisible(false));
      resetCanvas();
      setSprayComplete(false);
      hasCompletedSprayCan.current = false;
      sprayCompleteTimeoutRef.current = null;
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (throttledTimeoutRef.current) {
        clearTimeout(throttledTimeoutRef.current);
        throttledTimeoutRef.current = null;
      }
      if (sprayCompleteTimeoutRef.current) {
        clearTimeout(sprayCompleteTimeoutRef.current);
        sprayCompleteTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center' style={{ zIndex: sprayAreaVisible ? 1000 : -10 }}>
      <img
        className='absolute top-0 left-0 w-full h-full select-none pointer-events-none'
        src='/assets/backgrounds/brick.webp'
      />

      <img
        className='absolute h-1/3 select-none pointer-events-none opacity-50'
        src='/assets/tags/z.png'
      />

      <canvas
        ref={canvasRef}
        className='absolute top-0 left-0 w-full h-full cursor-crosshair'
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

      <div className='relative w-full aspect-[2.5] pointer-events-none select-none'>
        {/* Progress bar */}
        {sprayAreaVisible && (
          <div className='relative w-[450px] h-[32px] overflow-hidden top-8 left-8'>
            {/* Parallelogram background */}
            <div
              className='absolute inset-0 bg-black'
              style={{ clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }}
            />
            {/* Parallelogram fill */}
            <div
              className='absolute inset-0 bg-[#FFDE00] transition-all duration-300 ease-out'
              style={{ clipPath: `polygon(10% 0%, ${10 + (overlapPercentage * 0.8)}% 0%, ${overlapPercentage * 0.8}% 100%, 0% 100%)` }}
            />
            {/* 85% marker line */}
            <div
              className='absolute top-0 bottom-0 w-[3px] bg-[#FFDE00]'
              style={{ left: `${10 + (85 * 0.8) - 5.1}%`, transform: 'skewX(-54.583deg)', }}
            />
          </div>
        )}
        <img src='/assets/copy/fill-to-complete.svg' className='absolute top-18 left-32' />
        <div className='absolute top-8 left-0 w-full flex justify-center'>
          <img src='/assets/copy/tag-it.svg' />
        </div>
      </div>


      {/* Spray complete splash */}
      {sprayComplete && (
        <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none select-none z-0'>
          <img
            className='absolute h-3/4 select-none pointer-events-none scale-bounce -z-10'
            src='/assets/tags/spray-bg.webp'
          />
          <img src='/assets/copy/tag-complete.svg' className='w-1/4 scale-bounce' />
        </div>
      )}
    </div>
  );
});
