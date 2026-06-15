import type { KeyboardEvent } from 'react';

interface TabCellProps {
  stringLabel: string;
  value: number | null | undefined;
  isSelected: boolean;
  isActiveColumn: boolean;
  isUncertain: boolean;
  isEditing: boolean;
  draftValue: string;
  onSelect: () => void;
  onChangeDraft: (value: string) => void;
  onCommit: () => void;
  onClear: () => void;
  onNavigate: (direction: 'left' | 'right' | 'up' | 'down') => void;
}

export default function TabCell({
  stringLabel,
  value,
  isSelected,
  isActiveColumn,
  isUncertain,
  isEditing,
  draftValue,
  onSelect,
  onChangeDraft,
  onCommit,
  onClear,
  onNavigate,
}: TabCellProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onNavigate('left');
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNavigate('right');
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onNavigate('up');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onNavigate('down');
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      onClear();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      onCommit();
    }
  };

  return (
    <div className={`tab-grid-cell${isActiveColumn ? ' is-active-column' : ''}`}>
      {isEditing ? (
        <input
          aria-label={`Edit fret for string ${stringLabel}`}
          className={`tab-cell tab-cell--input${isSelected ? ' is-selected' : ''}${isUncertain ? ' is-uncertain' : ''}`}
          value={draftValue}
          autoFocus
          inputMode="numeric"
          onChange={(event) => onChangeDraft(event.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          onBlur={onCommit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          type="button"
          aria-label={`Tab cell ${stringLabel} ${value ?? 'empty'}`}
          className={`tab-cell${isSelected ? ' is-selected' : ''}${isUncertain ? ' is-uncertain' : ''}`}
          onClick={onSelect}
          onDoubleClick={onSelect}
          onKeyDown={handleKeyDown}
        >
          <span>{value ?? '·'}</span>
          {isUncertain ? <i className="tab-cell__warning" aria-hidden="true" /> : null}
        </button>
      )}
    </div>
  );
}
