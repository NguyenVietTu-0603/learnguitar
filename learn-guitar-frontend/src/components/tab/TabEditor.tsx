import AppCard from '../common/AppCard';
import type { SelectedCell, TabDetectionResult } from '../../features/tab/tab.types';
import TabStaffCard from './TabStaffCard';

interface TabEditorProps {
  result: TabDetectionResult | null;
  isLoading: boolean;
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

export default function TabEditor({
  result,
  isLoading,
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
}: TabEditorProps) {
  return (
    <AppCard className="tab-shell-card tab-shell-card--editor">
      <div className="tab-panel-heading tab-panel-heading--row">
        <div>
          <p className="tab-kicker">Editor</p>
          <h2>Structured tablature workspace</h2>
          <p>Edit trực tiếp theo schema `staffs[].events[].string_fret_map`.</p>
        </div>
        <div className="tab-editor-hint">
          <span>Arrow keys để di chuyển</span>
          <span>Delete để xoá</span>
        </div>
      </div>

      {isLoading ? (
        <div className="tab-editor-skeleton">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="tab-editor-skeleton__card" />
          ))}
        </div>
      ) : null}

      {!isLoading && !result ? (
        <div className="tab-editor-empty">
          <strong>Workspace đang chờ dữ liệu AI</strong>
          <span>Khi detect thành công, editor sẽ hiển thị staff cards để bạn chỉnh sửa tab.</span>
        </div>
      ) : null}

      {!isLoading && result ? (
        <div className="tab-editor-stack">
          {result.staffs.map((staff, staffIndex) => (
            <TabStaffCard
              key={staff.id}
              result={result}
              staff={staff}
              staffIndex={staffIndex}
              selectedCell={selectedCell}
              editingCellKey={editingCellKey}
              draftValue={draftValue}
              onSelectCell={onSelectCell}
              onChangeDraft={onChangeDraft}
              onCommitDraft={onCommitDraft}
              onClearCell={onClearCell}
              onNavigate={onNavigate}
              onAppendEvent={onAppendEvent}
              onRemoveEvent={onRemoveEvent}
            />
          ))}
        </div>
      ) : null}
    </AppCard>
  );
}
