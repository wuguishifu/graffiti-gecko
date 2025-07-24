import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { devActions } from '@/state/dev-slice';
import { useAppDispatch, useAppSelector } from '@/state/use-app-state';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export function DevMenu() {
  const devState = useAppSelector((state) => state.dev);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

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
        <Label className='cursor-pointer'>
          <h2 className='text-xl'>God Mode</h2>
          <Switch
            checked={devState.godMode}
            onCheckedChange={() => dispatch(devActions.toggleGodMode())}
          />
        </Label>
        <Label className='cursor-pointer'>
          <h2 className='text-xl'>Unlimited Stamina</h2>
          <Switch
            checked={devState.unlimitedStamina}
            onCheckedChange={() => dispatch(devActions.toggleUnlimitedStamina())}
          />
        </Label>
        <Label className='cursor-pointer'>
          <h2 className='text-xl'>Many Spray Cans</h2>
          <Switch
            checked={devState.manySprayCans}
            onCheckedChange={() => dispatch(devActions.toggleManySprayCans())}
          />
        </Label>
        <Label className='cursor-pointer'>
          <h2 className='text-xl'>One Percent Fill</h2>
          <Switch
            checked={devState.onePercentFill}
            onCheckedChange={() => dispatch(devActions.toggleOnePercentFill())}
          />
        </Label>
        <Label className='flex'>
          <h2 className='text-xl flex-1'>Override Timer</h2>
          <Input
            className='flex-1'
            type='number'
            value={devState.overrideTotalTime}
            onChange={(e) => dispatch(devActions.setTotalTime(Number(e.target.value)))}
          />
        </Label>
        <Button onClick={() => dispatch(devActions.reset())} className='cursor-pointer'>
          Reset
        </Button>
        <Link to='/' className={buttonVariants({ variant: 'default' })}>
          Back
        </Link>
      </div>
    </main>
  );
}
