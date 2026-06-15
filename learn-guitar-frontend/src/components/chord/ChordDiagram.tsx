import { useMemo } from 'react';
import '../../styles/chord-diagram.css';
import { resolveMediaUrl } from '../../utils/resolveUrl';

interface ChordDiagramProps {
  chordName: string;
  positions: number[];
  fingers?: number[];
  audioUrl?: string | null;
  size?: number;
}

const STRINGS = 6;
const FRETS = 5;

const normalizePositions = (positions: number[]) => {
  if (!Array.isArray(positions) || positions.length !== STRINGS) {
    return [0, 0, 0, 0, 0, 0];
  }
  return positions;
};

export default function ChordDiagram({
  chordName,
  positions,
  fingers = [],
  audioUrl = null,
  size = 240,
}: ChordDiagramProps) {
  const safePositions = normalizePositions(positions);

  const layout = useMemo(() => {
    const padding = size * 0.18;
    const gridWidth = size*0.75 - padding * 2;
    const stringGap = gridWidth / (STRINGS - 1);
    const fretGap = (size - padding * 2) / FRETS;

    const fretted = safePositions.filter((value) => value > 0);
    const minFret = fretted.length > 0 ? Math.min(...fretted) : 1;
    const baseFret = minFret > 1 ? minFret : 1;

    return {
      padding,
      gridWidth,
      stringGap,
      fretGap,
      baseFret,
    };
  }, [safePositions, size]);

  const markerRadius = Math.max(8, size * 0.035);

  return (
    <div className="chord-diagram-card">
      <div className="chord-diagram-header">
        <h3 className="chord-diagram-title">{chordName}</h3>
        {audioUrl ? (
          <audio controls preload="none" className="chord-diagram-audio">
            <source src={resolveMediaUrl(audioUrl) ?? undefined} type="audio/mpeg" />
            Trình duyệt không hỗ trợ phát audio.
          </audio>
        ) : null}
      </div>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="chord-diagram-svg">
        {[...Array(STRINGS)].map((_, index) => {
          const x = layout.padding + index * layout.stringGap;
          return (
            <line
              key={`string-${index}`}
              x1={x}
              y1={layout.padding}
              x2={x}
              y2={layout.padding + FRETS * layout.fretGap}
              stroke="#8a7c67"
              strokeWidth={index === 0 || index === STRINGS - 1 ? 2 : 1.4}
            />
          );
        })}

        {[...Array(FRETS + 1)].map((_, index) => {
          const y = layout.padding + index * layout.fretGap;
          return (
            <line
              key={`fret-${index}`}
              x1={layout.padding}
              y1={y}
              x2={layout.padding + layout.gridWidth}
              y2={y}
              stroke="#8a7c67"
              strokeWidth={index === 0 && layout.baseFret === 1 ? 4 : 1.4}
            />
          );
        })}

        {layout.baseFret > 1 ? (
          <text
            x={layout.padding - markerRadius * 1.8}
            y={layout.padding + layout.fretGap * 0.75}
            fill="#5f5445"
            fontSize={Math.max(12, size * 0.055)}
            fontWeight="700"
          >
            {layout.baseFret}
          </text>
        ) : null}

        {safePositions.map((position, index) => {
          const x = layout.padding + index * layout.stringGap;

          if (position === -1) {
            return (
              <text
                key={`mute-${index}`}
                x={x}
                y={layout.padding - markerRadius * 1.1}
                textAnchor="middle"
                fill="#a6432b"
                fontSize={Math.max(12, size * 0.07)}
                fontWeight="700"
              >
                X
              </text>
            );
          }

          if (position === 0) {
            return (
              <text
                key={`open-${index}`}
                x={x}
                y={layout.padding - markerRadius * 1.1}
                textAnchor="middle"
                fill="#6b8e5f"
                fontSize={Math.max(12, size * 0.07)}
                fontWeight="700"
              >
                O
              </text>
            );
          }

          const normalizedFret = layout.baseFret > 1 ? position - layout.baseFret + 1 : position;
          const y = layout.padding + (normalizedFret - 0.5) * layout.fretGap;
          const finger = fingers[index] ?? 0;

          return (
            <g key={`dot-${index}`}>
              <circle cx={x} cy={y} r={markerRadius} fill="#65462f" />
              {finger > 0 ? (
                <text
                  x={x}
                  y={y + markerRadius * 0.35}
                  textAnchor="middle"
                  fill="#fffaf3"
                  fontSize={Math.max(10, size * 0.05)}
                  fontWeight="700"
                >
                  {finger}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
