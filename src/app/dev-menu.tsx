import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { devActions } from '@/state/dev-slice';
import { useAppDispatch, useAppSelector } from '@/state/use-app-state';

export function DevMenu() {
  const devState = useAppSelector((state) => state.dev);
  const dispatch = useAppDispatch();

  return (
    <main className='absolute top-0 left-0 w-full h-full flex items-center justify-center'>
      <img className='absolute top-0 left-0 w-full h-full object-cover select-none pointer-events-none' src='/assets/backgrounds/brick.webp' />
      <div className='flex flex-col items-center gap-8 z-10'>
        <Label className='cursor-pointer'>
          <h2 className='text-xl'>Disable Cop AI</h2>
          <Switch
            checked={devState.disableCopAi}
            onCheckedChange={() => dispatch(devActions.toggleCopAi())}
          />
        </Label>
        <Button onClick={() => dispatch(devActions.reset())} className='cursor-pointer'>
          Reset
        </Button>
      </div>
    </main>
  );
}
