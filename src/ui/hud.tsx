import { useCallback } from 'react';

import { Timer } from '../components/timer';
import { Player } from '../game/player/player';
import { cn } from '../lib/utils';
import { useGame } from '../state/game-context';
import { useAppSelector } from '../state/use-app-state';

import { Energy } from '@/components/energy';
import { Lives } from '@/components/lives';
import { Tags } from '@/components/tags';

type HudProps = {
  onOpenSprayArea: () => void;
};

const dodgeTotalDurationSeconds = (Player.dodgeCooldownMs + Player.dodgeDurationMs) / 1000;

export function Hud({ onOpenSprayArea }: HudProps) {
  const nearSprayCan = useAppSelector((state) => state.game.nearSprayCan);
  const devMode = useAppSelector((state) => state.dev.isDirty);
  const { gameInstance } = useGame();

  const canDodge = useAppSelector((state) => state.game.dodgeState.canDodge);
  const dodgeTimeRemaining = useAppSelector((state) => state.game.dodgeState.cooldownRemainingMs);

  const handleDodge = useCallback(() => {
    gameInstance.current?.player?.dodge();
  }, [gameInstance]);

  return (
    <div className="absolute top-0 left-0 w-full h-full px-20 py-8 overflow-x-hidden">
      <div className="relative w-full h-full">
        <div className="flex flex-row items-center justify-between select-none pointer-events-none">
          <Tags />
          <Energy />
          <Lives />
        </div>
        {nearSprayCan && (
          <button
            className="absolute bottom-0 right-0 cursor-pointer hover:scale-110 transition-transform"
            onClick={onOpenSprayArea}
            tabIndex={-1}
          >
            <img src="/assets/icons/can.png" className="size-64 pointer-events-none select-none" tabIndex={-1} />
          </button>
        )}
        <div className="absolute bottom-0 left-0 flex items-center gap-2">
          <button
            className={cn(
              'cursor-pointer hover:scale-110 transition-transform ',
              canDodge ? '' : 'opacity-50 pointer-events-none',
            )}
            onClick={handleDodge}
            tabIndex={-1}
          >
            <img src="/assets/icons/dodge.png" className="size-64 pointer-events-none select-none" tabIndex={-1} />
          </button>

          {!canDodge && (
            <Timer
              remainingDurationSeconds={dodgeTimeRemaining / 1000}
              totalDurationSeconds={dodgeTotalDurationSeconds}
              size={40}
              strokeWidth={5}
            />
          )}
        </div>

        {devMode && (
          <div className="absolute top-0 w-full flex justify-center pointer-events-none select-none">
            <span className="!text-red-500 font-bold">dev mode enabled - score will not be saved</span>
          </div>
        )}
      </div>
    </div>
  );
}
