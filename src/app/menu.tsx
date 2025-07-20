export function MainMenu() {
  return (
    <main className='h-full flex items-center justify-center'>
      <img
        className='absolute top-0 left-0 w-full h-full -z-10 select-none pointer-events-none'
        src='/assets/screens/start.png'
      />
      <a href='/game' className='w-72 py-4 border rounded-xl flex justify-center cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors'>
        <h1 className='text-2xl'>
          Start
        </h1>
      </a>
    </main>
  );
}
