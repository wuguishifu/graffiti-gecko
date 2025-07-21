export function MainMenu() {
  return (
    <main className='h-full flex items-center justify-center'>
      <img
        className='absolute top-0 left-0 w-full h-full -z-10 select-none pointer-events-none object-cover'
        src='/assets/screens/start.png'
      />
      <div className='text-center absolute top-[50%] left-[30%] flex flex-col gap-8'>
        <a href='/game' className='hover:scale-110 transition-transform'>
          <img src='/assets/copy/start-run.svg' />
        </a>
        <a href='/settings' className='hover:scale-110 transition-transform'>
          <img src='/assets/copy/settings.svg' />
        </a>
      </div>
    </main>
  );
}
