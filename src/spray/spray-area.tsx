import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { soundService } from '../game/sound/sound';
import { useGame } from '../state/game-context';
import { gameActions } from '../state/game-slice';
import { useAppDispatch, useAppSelector } from '../state/use-app-state';

import { Lives } from '@/components/lives';
import { store } from '@/state/store';

export type SprayAreaRef = {
  reset: () => void;
};

const tagImages = [
  '/assets/tags/b.png',
  '/assets/tags/crown.png',
  '/assets/tags/f.png',
  '/assets/tags/heart.png',
  '/assets/tags/s.png',
  '/assets/tags/scribble.png',
  '/assets/tags/sparkle.png',
  '/assets/tags/star1.png',
  '/assets/tags/star2.png',
  '/assets/tags/y.png',
  '/assets/tags/z.png',
] as const;

const selectRandomTagImage = () => {
  const randomIndex = Math.floor(Math.random() * tagImages.length);
  return tagImages[randomIndex];
};

type TagImages = (typeof tagImages)[number];

export const SprayArea = forwardRef<SprayAreaRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [overlapPercentage, setOverlapPercentage] = useState(0);
  const throttledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { gameInstance } = useGame();

  const dispatch = useAppDispatch();
  const dispatchRef = useRef(dispatch);

  const sprayColor = useAppSelector((state) => state.data.sprayColor);

  const [src, setSrc] = useState<TagImages>(selectRandomTagImage());
  const previousSrc = useRef<TagImages | null>(src);

  useImperativeHandle(ref, () => ({
    reset: () => {
      resetCanvas();
      let newSrc: TagImages;
      do {
        newSrc = selectRandomTagImage();
      } while (newSrc === previousSrc.current);
      setSrc(newSrc);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

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
    if (!tagCanvas) {
      return;
    }

    const tagCtx = tagCanvas.getContext('2d');
    if (!tagCtx) {
      return;
    }

    const tagImg = new Image();
    tagImg.onload = () => {
      // Set tag canvas size to match the main canvas
      const mainCanvas = canvasRef.current;
      if (!mainCanvas) {
        return;
      }

      const rect = mainCanvas.getBoundingClientRect();
      tagCanvas.width = rect.width;
      tagCanvas.height = rect.height;

      // Clear the tag canvas
      tagCtx.clearRect(0, 0, tagCanvas.width, tagCanvas.height);

      // Calculate tag position to center it and make it half height
      const tagAspectRatio = tagImg.width / tagImg.height;
      const tagHeight = (rect.height * 2) / 3;
      const tagWidth = tagHeight * tagAspectRatio;
      const tagX = (rect.width - tagWidth) / 2;
      const tagY = ((rect.height - tagHeight) * 2.2) / 3;

      // Draw the tag image
      tagCtx.drawImage(tagImg, tagX, tagY, tagWidth, tagHeight);
    };
    tagImg.src = src;
  }, [src]);

  const calculateOverlap = () => {
    const canvas = canvasRef.current;
    const tagCanvas = tagCanvasRef.current;
    if (!canvas || !tagCanvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const tagCtx = tagCanvas.getContext('2d');
    if (!ctx || !tagCtx) {
      return;
    }

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
    const calculatedOverlapPercent = tagPixels > 0 ? (overlappingPixels / tagPixels) * 100 : 0;
    setOverlapPercentage(Math.round(calculatedOverlapPercent));

    if (calculatedOverlapPercent >= (store.getState().dev.onePercentFill ? 1 : 90)) {
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

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset overlap percentage
    setOverlapPercentage(0);

    // Reset completion flag
    hasCompletedSprayCan.current = false;
  }, []);

  const startPainting = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default to avoid conflicts
    setIsPainting(true);
    paint(e);
  };

  const stopPainting = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsPainting(false);
  };

  soundService.stopSound('policeWalk');

  useEffect(() => {
    if (isPainting) {
      soundService.playSound('spray', 0.3, true);
    } else {
      soundService.stopSound('spray');
    }
    return () => {
      soundService.stopSound('spray');
    };
  }, [isPainting]);

  const paint = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default to avoid conflicts
    if (!isPainting) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

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

    const numSprays = Math.random() * 5 + 3;

    for (let i = 0; i < numSprays; i++) {
      const sprayX = x + (Math.random() - 0.5) * 40;
      const sprayY = y + (Math.random() - 0.5) * 40;
      const size = Math.random() * 4 + 4;

      ctx.beginPath();
      ctx.arc(sprayX, sprayY, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    throttledCalculateOverlap();
  };

  const [sprayComplete, setSprayComplete] = useState(false);
  const sprayCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedSprayCan = useRef(false);

  const onSprayComplete = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Prevent multiple completions for the same spray can
    if (hasCompletedSprayCan.current) {
      return;
    }
    soundService.playSound('success');
    hasCompletedSprayCan.current = true;

    const activeSprayCanId = store.getState().game.activeSprayCanId;

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const activeSprayCanId = store.getState().game.activeSprayCanId;
      if (gameInstance.current && activeSprayCanId != null) {
        gameInstance.current.failSprayCan(activeSprayCanId);
      }

      hasCompletedSprayCan.current = true;

      // TODO: potentially show message that the user failed
      dispatchRef.current(gameActions.setSprayAreaVisible(false));
      dispatchRef.current(gameActions.failSprayCan());
      resetCanvas();
      hasCompletedSprayCan.current = false;
    }, 5_000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameInstance, resetCanvas]);

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
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-1000 bg-black">
      <img
        className="absolute top-0 left-0 w-full h-full select-none pointer-events-none"
        src="/assets/backgrounds/brick.webp"
      />

      {/* Hidden canvas for tag processing */}
      <canvas className="absolute pointer-events-none select-none" ref={tagCanvasRef} />

      <div className="relative w-full aspect-[2.5] pointer-events-none select-none">
        {/* Progress bar */}
        <div className="relative w-[450px] h-[32px] overflow-hidden top-8 left-8">
          {/* Parallelogram background */}
          <div
            className="absolute inset-0 bg-black"
            style={{ clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }}
          />
          {/* Parallelogram fill */}
          <div
            className="absolute inset-0 bg-[#FFDE00] transition-all duration-300 ease-out"
            style={{
              clipPath: `polygon(10% 0%, ${10 + overlapPercentage * 0.8}% 0%, ${overlapPercentage * 0.8}% 100%, 0% 100%)`,
            }}
          />
          {/* 85% marker line */}
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-[#FFDE00]"
            style={{ left: `${10 + 90 * 0.8 - 5.1}%`, transform: 'skewX(-54.583deg)' }}
          />
        </div>
        <img src="/assets/copy/fill-to-complete.svg" className="absolute top-18 left-32" />
        <div className="absolute top-8 left-0 w-full flex justify-center">
          <img src="/assets/copy/tag-it.svg" />
        </div>
        <div className="absolute -top-8 right-20">
          <Lives />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
        onMouseDown={startPainting}
        onMouseUp={stopPainting}
        onMouseLeave={stopPainting}
        onMouseMove={paint}
        onTouchStart={startPainting}
        onTouchEnd={stopPainting}
        onTouchMove={paint}
        style={{ touchAction: 'none' }}
      />

      {/* Spray complete splash */}
      {sprayComplete && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none select-none z-0">
          <img
            className="absolute h-3/4 select-none pointer-events-none scale-bounce -z-10"
            src="/assets/tags/spray-bg.webp"
          />
          <img src="/assets/copy/tag-complete.svg" className="w-1/4 scale-bounce" />
        </div>
      )}
    </div>
  );
});

SprayArea.displayName = 'SprayArea';
