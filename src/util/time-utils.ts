export function secondsToTimeString(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}
