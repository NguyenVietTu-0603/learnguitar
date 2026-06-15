import type { CSSProperties } from 'react';

interface TabNote {
  string: string;
  fret: number;
  confidence?: number;
}

interface TabBeat {
  xCenter: number;
  notes: TabNote[];
}

interface TabStaffProps {
  beats: TabBeat[];
  barlines?: number[];
  activeBeatIndex: number | null;
  className?: string;
  style?: CSSProperties;
}

const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];

export default function TabStaff({ beats, barlines, activeBeatIndex, className, style }: TabStaffProps) {
  const beatCount = beats.length;
  const leftGutter = 56;
  const rightGutter = 36;
  const topPadding = 28;
  const lineSpacing = 30;
  const rowGap = 26;
  const rowHeight = topPadding + (STRING_LABELS.length - 1) * lineSpacing + 28;
  const staffWidth = 1000;
  const innerWidth = staffWidth - leftGutter - rightGutter;
  const highlightWidth = Math.max(28, Math.min(70, innerWidth / Math.max(4, beatCount || 1)));

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const resolveX = (xCenter: number) => leftGutter + clamp01(xCenter) * innerWidth;
  const wrapThreshold = 0.12;

  const rows: Array<{ start: number; end: number; beats: TabBeat[] }> = [];
  let rowStart = 0;
  let previousX = -1;
  beats.forEach((beat, index) => {
    const current = clamp01(beat.xCenter);
    if (index > 0 && current < previousX - wrapThreshold) {
      rows.push({ start: rowStart, end: index, beats: beats.slice(rowStart, index) });
      rowStart = index;
    }
    previousX = current;
  });
  rows.push({ start: rowStart, end: beatCount, beats: beats.slice(rowStart) });

  const barlineRows: number[][] = [];
  if (barlines && barlines.length > 0) {
    let barStart = 0;
    let prevBar = -1;
    barlines.forEach((bar, index) => {
      const current = clamp01(bar);
      if (index > 0 && current < prevBar - wrapThreshold) {
        barlineRows.push(barlines.slice(barStart, index));
        barStart = index;
      }
      prevBar = current;
    });
    barlineRows.push(barlines.slice(barStart));
  }

  const staffHeight = rows.length * rowHeight + Math.max(0, rows.length - 1) * rowGap;

  return (
    <div className={`tab-staff ${className ?? ''}`.trim()} style={style}>
      <svg
        viewBox={`0 0 ${staffWidth} ${staffHeight}`}
        width="100%"
        height={staffHeight}
        role="img"
        aria-label="Guitar tab"
      >
        <defs>
          <linearGradient id="tabGrid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8f1e6" />
            <stop offset="100%" stopColor="#fffaf2" />
          </linearGradient>
        </defs>

        <rect x={0} y={0} width={staffWidth} height={staffHeight} fill="url(#tabGrid)" rx={18} />

        {rows.map((row, rowIndex) => {
          const rowOffset = rowIndex * (rowHeight + rowGap);
          const activeInRow =
            activeBeatIndex !== null && activeBeatIndex >= row.start && activeBeatIndex < row.end
              ? activeBeatIndex - row.start
              : null;
          const rowBarlines = barlineRows[rowIndex] ?? [];

          return (
            <g key={`row-${rowIndex}`} transform={`translate(0, ${rowOffset})`}>
              {STRING_LABELS.map((label, idx) => {
                const y = topPadding + idx * lineSpacing;
                return (
                  <g key={`${label}-${rowIndex}`}>
                    <text x={18} y={y + 5} className="tab-staff-label">
                      {label}
                    </text>
                    <line x1={leftGutter} y1={y} x2={staffWidth - rightGutter} y2={y} className="tab-staff-line" />
                  </g>
                );
              })}

              {activeInRow !== null && row.beats[activeInRow] && (
                <rect
                  className="tab-staff-highlight"
                  x={resolveX(row.beats[activeInRow].xCenter) - highlightWidth / 2}
                  y={topPadding - 16}
                  width={highlightWidth}
                  height={lineSpacing * (STRING_LABELS.length - 1) + 32}
                  rx={12}
                />
              )}

              {rowBarlines.map((xNorm, idx) => {
                const x = resolveX(xNorm);
                return (
                  <line
                    key={`bar-${rowIndex}-${idx}`}
                    x1={x}
                    y1={topPadding - 6}
                    x2={x}
                    y2={topPadding + lineSpacing * (STRING_LABELS.length - 1) + 6}
                    className="tab-staff-bar"
                  />
                );
              })}

              {row.beats.map((beat, beatIndex) => {
                const x = resolveX(beat.xCenter);
                return beat.notes.map((note, noteIndex) => {
                  const stringIndex = STRING_LABELS.indexOf(note.string);
                  if (stringIndex < 0) {
                    return null;
                  }
                  const y = topPadding + stringIndex * lineSpacing;
                  const key = `${rowIndex}-${beatIndex}-${noteIndex}`;
                  return (
                    <g key={key}>
                      <circle className="tab-staff-note-circle" cx={x} cy={y} r={12} />
                      <text className="tab-staff-note-text" x={x} y={y}>
                        {note.fret}
                      </text>
                    </g>
                  );
                });
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
