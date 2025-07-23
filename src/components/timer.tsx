export function Timer({
  remainingDurationSeconds,
  totalDurationSeconds
}: {
  remainingDurationSeconds: number;
  totalDurationSeconds: number;
}) {
  const clampedRemaining = Math.max(0, Math.min(remainingDurationSeconds, totalDurationSeconds));
  const elapsed = totalDurationSeconds - clampedRemaining;
  const percentElapsed = totalDurationSeconds === 0 ? 0 : elapsed / totalDurationSeconds;

  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // 30° offset from 12 o'clock
  const startAngle = -Math.PI / 2 + Math.PI / 7;
  const endAngle = startAngle + percentElapsed * 2 * Math.PI;
  const wedgeRadius = radius - strokeWidth;

  const x1 = center + wedgeRadius * Math.cos(startAngle);
  const y1 = center + wedgeRadius * Math.sin(startAngle);
  const x2 = center + wedgeRadius * Math.cos(endAngle);
  const y2 = center + wedgeRadius * Math.sin(endAngle);
  const largeArcFlag = percentElapsed > 0.5 ? 1 : 0;

  const wedgePath = percentElapsed > 0 ?
    `M ${center} ${center} L ${x1} ${y1} A ${wedgeRadius} ${wedgeRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    : '';

  return (
    <svg width={size} height={size}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="white"
        stroke="black"
        strokeWidth={strokeWidth}
      />
      {percentElapsed > 0 && (
        <path d={wedgePath} fill="black" />
      )}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="black"
        strokeWidth={strokeWidth}
        pointerEvents="none"
      />
    </svg>
  );
}
