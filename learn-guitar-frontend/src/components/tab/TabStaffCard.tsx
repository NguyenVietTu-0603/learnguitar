import type { SelectedCell, TabDetectionResult, TabStaff } from '../../features/tab/tab.types';
import { TAB_STRINGS } from '../../features/tab/tab.types';
import { getNotesForEvent } from '../../features/tab/tab.utils';
import TabCell from './TabCell';

interface TabStaffCardProps {
  result: TabDetectionResult;
  staff: TabStaff;
  staffIndex: number;
  selectedCell: SelectedCell | null;
  editingCellKey: string | null;
  draftValue: string;
  onSelectCell: (cell: SelectedCell) => void;
  onChangeDraft: (value: string) => void;
  onCommitDraft: () => void;
  onClearCell: (cell: SelectedCell) => void;
  onNavigate: (cell: SelectedCell, direction: 'left' | 'right' | 'up' | 'down') => void;
  onAppendEvent: (staffIndex: number) => void;
  onRemoveEvent: (staffIndex: number, eventIndex: number) => void;
}

function buildCellKey(staffIndex: number, eventIndex: number, stringIndex: number) {
  return `${staffIndex}-${eventIndex}-${stringIndex}`;
}

export default function TabStaffCard({
  result,
  staff,
  staffIndex,
  selectedCell,
  editingCellKey,
  draftValue,
  onSelectCell,
  onChangeDraft,
  onCommitDraft,
  onClearCell,
  onNavigate,
  onAppendEvent,
  onRemoveEvent,
}: TabStaffCardProps) {
  return (
    <section className="tab-staff-card">
      <div className="tab-staff-card__header">
        <div>
          <span className="tab-staff-card__eyebrow">Staff {staffIndex + 1}</span>
          <h3>{staff.label || `Tab section ${staffIndex + 1}`}</h3>
        </div>

        <div className="tab-staff-card__actions">
          <button type="button" className="tab-mini-btn" onClick={() => onAppendEvent(staffIndex)}>
            Add event
          </button>
        </div>
      </div>

      <div className="tab-grid-shell">
        <div className="tab-grid-header-row">
          <div className="tab-grid-string-head" />
          <div className="tab-grid-events">
            {staff.events.map((event, eventIndex) => {
              const isActive = selectedCell?.staffIndex === staffIndex && selectedCell.eventIndex === eventIndex;
              return (
                <div key={event.id} className={`tab-event-head${isActive ? ' is-active' : ''}`}>
                  <button
                    type="button"
                    className="tab-event-head__button"
                    onClick={() => onSelectCell({
                      staffIndex,
                      eventIndex,
                      stringIndex: selectedCell?.staffIndex === staffIndex && selectedCell?.eventIndex === eventIndex
                        ? selectedCell.stringIndex
                        : 0,
                    })}
                  >
                    <span>E{eventIndex + 1}</span>
                    <small>{event.x_center ?? '—'}</small>
                  </button>
                  <button
                    type="button"
                    className="tab-event-head__remove"
                    onClick={() => onRemoveEvent(staffIndex, eventIndex)}
                    disabled={staff.events.length <= 1}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tab-grid-body">
          <div className="tab-grid-strings">
            {TAB_STRINGS.map((label) => (
              <div key={label} className="tab-grid-string-label">{label}</div>
            ))}
          </div>

          <div className="tab-grid-events">
            {staff.events.map((event, eventIndex) => {
              const notes = getNotesForEvent(result, staffIndex, eventIndex);
              const isActiveColumn = selectedCell?.staffIndex === staffIndex && selectedCell.eventIndex === eventIndex;

              return (
                <div key={event.id} className={`tab-event-column${isActiveColumn ? ' is-active' : ''}`}>
                  {TAB_STRINGS.map((label, stringIndex) => {
                    const cell = { staffIndex, eventIndex, stringIndex };
                    const note = notes.find((item) => item.string_index === stringIndex);
                    const cellKey = buildCellKey(staffIndex, eventIndex, stringIndex);
                    const isSelected = selectedCell?.staffIndex === staffIndex
                      && selectedCell?.eventIndex === eventIndex
                      && selectedCell?.stringIndex === stringIndex;

                    return (
                      <TabCell
                        key={cellKey}
                        stringLabel={label}
                        value={event.string_fret_map[label]}
                        isSelected={isSelected}
                        isActiveColumn={isActiveColumn}
                        isUncertain={Boolean(note?.uncertain)}
                        isEditing={editingCellKey === cellKey}
                        draftValue={draftValue}
                        onSelect={() => onSelectCell(cell)}
                        onChangeDraft={onChangeDraft}
                        onCommit={onCommitDraft}
                        onClear={() => onClearCell(cell)}
                        onNavigate={(direction) => onNavigate(cell, direction)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
