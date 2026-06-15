import AppCard from '../common/AppCard';
import type { SelectedCell, TabDetectionResult } from '../../features/tab/tab.types';
import { TAB_STRINGS } from '../../features/tab/tab.types';
import { getNotesForEvent, getSelectedEvent } from '../../features/tab/tab.utils';

interface SelectedEventInspectorProps {
  result: TabDetectionResult | null;
  selectedCell: SelectedCell | null;
}

export default function SelectedEventInspector({ result, selectedCell }: SelectedEventInspectorProps) {
  const event = getSelectedEvent(result, selectedCell);
  const notes = selectedCell ? getNotesForEvent(result, selectedCell.staffIndex, selectedCell.eventIndex) : [];

  return (
    <AppCard className="tab-shell-card">
      <div className="tab-panel-heading">
        <p className="tab-kicker">Inspector</p>
        <h3>Selected event</h3>
      </div>

      {selectedCell && event ? (
        <div className="tab-inspector">
          <div className="tab-inspector__meta">
            <div>
              <span>Staff</span>
              <strong>{selectedCell.staffIndex + 1}</strong>
            </div>
            <div>
              <span>Event</span>
              <strong>{selectedCell.eventIndex + 1}</strong>
            </div>
            <div>
              <span>x_center</span>
              <strong>{event.x_center ?? '—'}</strong>
            </div>
            <div>
              <span>note_count</span>
              <strong>{notes.filter((note) => note.fret !== null).length}</strong>
            </div>
          </div>

          <div className="tab-inspector__strings">
            {TAB_STRINGS.map((label, stringIndex) => {
              const note = notes.find((item) => item.string_index === stringIndex);
              const fret = event.string_fret_map[label];
              return (
                <div key={label} className="tab-inspector__string-row">
                  <span>{label}</span>
                  <strong>{fret ?? '—'}</strong>
                  <small>{note?.uncertain ? 'uncertain' : note?.note_name ?? 'stable'}</small>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="tab-inspector__empty">
          <strong>Chưa chọn event nào</strong>
          <span>Click vào một cột hoặc một cell trong editor để xem chi tiết.</span>
        </div>
      )}
    </AppCard>
  );
}
