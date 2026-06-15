interface ProgressRingProps {
  value: number;
  label?: string;
  size?: number;
}

export default function ProgressRing({ value, label = 'Tiến độ', size = 124 }: ProgressRingProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (safeValue / 100) * circumference;

  return (
    <div className="progress-ring-wrapper" role="img" aria-label={`${label}: ${safeValue}%`}>
      <svg width={size} height={size} className="progress-ring">
        <circle className="progress-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="progress-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>
      <div className="progress-ring-content">
        <strong>{safeValue}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
