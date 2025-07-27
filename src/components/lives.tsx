import { useAppSelector } from '@/state/use-app-state';

export function Lives() {
  const lives = useAppSelector((state) => state.game.lives);

  return (
    <div className="h-40 flex items-center w-96 justify-center">
      <div className="bg-[#665F4D] border-3 border-white h-12 px-4 flex justify-center rounded-xl">
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }, (_, index) =>
            lives > index ? (
              <img key={index} src="./assets/icons/heart-full.png" className="size-8" />
            ) : (
              <img key={index} src="./assets/icons/heart-empty.png" className="size-8" />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
