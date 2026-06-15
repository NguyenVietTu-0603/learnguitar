import type { TabDetectionResult, TabStaff } from '../../features/tab/tab.types';

const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
const STRING_COUNT = 6;

const STAFF_LINE_GAP = 14;
const STAFF_TOTAL_HEIGHT = (STRING_COUNT - 1) * STAFF_LINE_GAP;
const STAFF_LEFT_PADDING = 52;
const STAFF_RIGHT_PADDING = 28;
const EVENT_WIDTH = 42;
const MEASURE_BAR_EVERY = 4;
const STAFF_GAP = 48;
const STAFF_TOP_PADDING = 36;
const STAFF_BOTTOM_PADDING = 24;

interface StaffBlockLayout {
  staffId: number;
  staffIndex: number;
  staffY: number;
  staffHeight: number;
  staffWidth: number;
  totalHeight: number;
  eventStart: number;
  eventCount: number;
  events: TabStaff['events'];
}

function measureStaffs(staffs: TabStaff[]): StaffBlockLayout[] {
  const layouts: StaffBlockLayout[] = [];
  let currentY = STAFF_TOP_PADDING;
  let eventStart = 0;

  for (let si = 0; si < staffs.length; si++) {
    const staff = staffs[si];
    const eventCount = staff.events.length;
    const measureCount = Math.ceil(eventCount / MEASURE_BAR_EVERY);
    const staffWidth =
      STAFF_LEFT_PADDING +
      eventCount * EVENT_WIDTH +
      measureCount * 8 +
      STAFF_RIGHT_PADDING;

    layouts.push({
      staffId: staff.staff_index,
      staffIndex: si,
      staffY: currentY,
      staffHeight: STAFF_TOTAL_HEIGHT,
      staffWidth,
      totalHeight: STAFF_TOTAL_HEIGHT + STAFF_TOP_PADDING + STAFF_BOTTOM_PADDING,
      eventStart,
      eventCount,
      events: staff.events,
    });

    eventStart += eventCount;
    currentY += STAFF_TOTAL_HEIGHT + STAFF_TOP_PADDING + STAFF_BOTTOM_PADDING + STAFF_GAP;
  }

  return layouts;
}

function renderStaff(lines: {
  layouts: StaffBlockLayout[];
  svgWidth: number;
  svgHeight: number;
  highlightEvent?: number;
}): string {
  const { layouts, svgWidth, svgHeight, highlightEvent = -1 } = lines;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" class="tab-staff-svg" style="display:block;width:100%;height:auto;overflow:visible;">`;

  svg += `
  <defs>
    <style>
      .tab-string-line { stroke: #3a3028; stroke-width: 1.2; }
      .tab-string-label { font-family: 'Poppins', 'Segoe UI', sans-serif; font-size: 11px; font-weight: 700; fill: #8a7860; text-anchor: end; dominant-baseline: middle; }
      .tab-fret-text { font-family: 'Poppins', 'Segoe UI', sans-serif; font-size: 11px; font-weight: 600; fill: #2c2c2c; text-anchor: middle; dominant-baseline: middle; }
      .tab-fret-text--active { font-family: 'Poppins', 'Segoe UI', sans-serif; font-size: 11px; font-weight: 700; fill: #1a1a1a; text-anchor: middle; dominant-baseline: middle; }
      .tab-fret-dot { fill: #3a3028; }
      .tab-measure-bar { stroke: #3a3028; stroke-width: 1.5; }
      .tab-staff-bg { fill: rgba(249, 245, 238, 0.95); }
      .tab-staff-border { fill: none; stroke: rgba(200, 185, 165, 0.5); stroke-width: 1; }
      .tab-staff-label { font-family: 'Poppins', 'Segoe UI', sans-serif; font-size: 9px; font-weight: 600; fill: #a09080; letter-spacing: 0.06em; text-transform: uppercase; }
      .tab-staff-rule { stroke: rgba(200, 185, 165, 0.4); stroke-width: 0.75; stroke-dasharray: 3,3; }
    </style>
  </defs>
  `;

  for (const layout of layouts) {
    const { staffY, staffWidth, staffHeight } = layout;
    const bgTop = staffY - STAFF_TOP_PADDING + 10;
    const bgHeight = staffHeight + STAFF_TOP_PADDING + STAFF_BOTTOM_PADDING - 20;

    svg += `<rect x="0" y="${bgTop}" width="${staffWidth}" height="${bgHeight}" rx="8" class="tab-staff-bg" />`;
    svg += `<rect x="0" y="${bgTop}" width="${staffWidth}" height="${bgHeight}" rx="8" class="tab-staff-border" />`;

    svg += `<text x="14" y="${staffY - 10}" class="tab-staff-label">STAFF ${layout.staffId + 1}</text>`;

    for (let s = 0; s < STRING_COUNT; s++) {
      const y = staffY + s * STAFF_LINE_GAP;
      svg += `<line x1="${STAFF_LEFT_PADDING - 12}" y1="${y}" x2="${staffWidth - 8}" y2="${y}" class="tab-string-line" />`;
      svg += `<text x="${STAFF_LEFT_PADDING - 18}" y="${y}" class="tab-string-label">${STRING_LABELS[s]}</text>`;
    }

    svg += `<line x1="${STAFF_LEFT_PADDING - 8}" y1="${staffY}" x2="${STAFF_LEFT_PADDING - 8}" y2="${staffY + staffHeight}" class="tab-measure-bar" />`;
    svg += `<line x1="${STAFF_LEFT_PADDING - 5}" y1="${staffY}" x2="${STAFF_LEFT_PADDING - 5}" y2="${staffY + staffHeight}" class="tab-measure-bar" />`;

    for (let e = 0; e < layout.events.length; e++) {
      const event = layout.events[e];
      const stringFretMap = event.string_fret_map ?? {};
      const x = STAFF_LEFT_PADDING + e * EVENT_WIDTH;
      const globalEvent = layout.eventStart + e;
      const isActive = globalEvent === highlightEvent;

      for (let s = 0; s < STRING_COUNT; s++) {
        const fret = stringFretMap[STRING_LABELS[s]];
        if (fret !== undefined && fret !== null) {
          const cy = staffY + s * STAFF_LINE_GAP;
          const cssClass = isActive ? 'tab-fret-text--active' : 'tab-fret-text';
          svg += `<text x="${x + EVENT_WIDTH / 2}" y="${cy}" class="${cssClass}">${fret}</text>`;
        }
      }

      if ((e + 1) % MEASURE_BAR_EVERY === 0) {
        const barX = STAFF_LEFT_PADDING + (e + 1) * EVENT_WIDTH;
        svg += `<line x1="${barX}" y1="${staffY}" x2="${barX}" y2="${staffY + staffHeight}" class="tab-measure-bar" />`;
      }
    }

    const endX = STAFF_LEFT_PADDING + layout.events.length * EVENT_WIDTH;
    svg += `<line x1="${endX + 4}" y1="${staffY}" x2="${endX + 4}" y2="${staffY + staffHeight}" class="tab-measure-bar" />`;
    svg += `<line x1="${endX + 8}" y1="${staffY}" x2="${endX + 8}" y2="${staffY + staffHeight}" class="tab-measure-bar" />`;
  }

  svg += '</svg>';
  return svg;
}

function computeSvgDimensions(staffs: TabStaff[]): { width: number; height: number } {
  let maxWidth = 600;
  let totalHeight = 0;

  const layouts = measureStaffs(staffs);
  for (const layout of layouts) {
    maxWidth = Math.max(maxWidth, layout.staffWidth);
    totalHeight += layout.totalHeight + STAFF_GAP;
  }
  totalHeight = Math.max(totalHeight - STAFF_GAP, 200);

  return { width: maxWidth, height: totalHeight };
}

function getPlayheadX(currentTick: number, layouts: StaffBlockLayout[]): number {
  for (const layout of layouts) {
    const localIdx = currentTick - layout.eventStart;
    if (localIdx >= 0 && localIdx < layout.eventCount) {
      return STAFF_LEFT_PADDING + localIdx * EVENT_WIDTH + EVENT_WIDTH / 2;
    }
  }
  if (currentTick < 0) return STAFF_LEFT_PADDING + EVENT_WIDTH / 2;
  const lastLayout = layouts[layouts.length - 1];
  if (!lastLayout) return STAFF_LEFT_PADDING;
  return STAFF_LEFT_PADDING + lastLayout.eventCount * EVENT_WIDTH + EVENT_WIDTH / 2;
}

interface TabStaffSVGProps {
  result: TabDetectionResult | null;
  isLoading?: boolean;
  currentTick?: number;
  isPlaying?: boolean;
}

export default function TabStaffSVG({ result, isLoading, currentTick = -1, isPlaying = false }: TabStaffSVGProps) {
  if (isLoading) {
    return (
      <div className="tab-staff-loading">
        <div className="tab-staff-loading__shimmer" />
        <span>Rendering tablature...</span>
      </div>
    );
  }

  if (!result || !result.staffs || result.staffs.length === 0) {
    return (
      <div className="tab-staff-empty">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="16" width="32" height="2" rx="1" fill="#c8b89a" />
          <rect x="8" y="22" width="32" height="2" rx="1" fill="#c8b89a" />
          <rect x="8" y="28" width="32" height="2" rx="1" fill="#c8b89a" />
          <rect x="8" y="34" width="32" height="2" rx="1" fill="#c8b89a" />
          <text x="6" y="14" fontSize="8" fill="#a09080" fontWeight="700" textAnchor="end" fontFamily="sans-serif">e</text>
          <text x="6" y="20" fontSize="8" fill="#a09080" fontWeight="700" textAnchor="end" fontFamily="sans-serif">B</text>
          <text x="6" y="26" fontSize="8" fill="#a09080" fontWeight="700" textAnchor="end" fontFamily="sans-serif">G</text>
          <text x="6" y="32" fontSize="8" fill="#a09080" fontWeight="700" textAnchor="end" fontFamily="sans-serif">D</text>
          <text x="6" y="38" fontSize="8" fill="#a09080" fontWeight="700" textAnchor="end" fontFamily="sans-serif">A</text>
        </svg>
        <strong>Tab chưa sẵn sàng</strong>
        <span>Upload ảnh và nhấn Detect để xem tablature.</span>
      </div>
    );
  }

  const { width, height } = computeSvgDimensions(result.staffs);
  const layouts = measureStaffs(result.staffs);
  const svgMarkup = renderStaff({ layouts, svgWidth: width, svgHeight: height, highlightEvent: currentTick });

  const playheadX = getPlayheadX(currentTick, layouts);
  const playheadTop = layouts.length > 0 ? layouts[0].staffY - STAFF_TOP_PADDING : 0;
  const playheadHeight = layouts.reduce((h, l) => h + l.totalHeight, 0) + (layouts.length - 1) * STAFF_GAP;

  return (
    <div className="tab-staff-scroll-container">
      <div className="tab-staff-svg-wrapper" style={{ position: 'relative' }}>
        <div
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
        {currentTick >= 0 && (
          <div
            className={`tab-playhead ${isPlaying ? 'tab-playhead--active' : ''}`}
            style={{
              left: playheadX,
              top: playheadTop,
              height: playheadHeight,
            }}
          />
        )}
      </div>
    </div>
  );
}

export { measureStaffs, getPlayheadX, EVENT_WIDTH, STAFF_LEFT_PADDING };
