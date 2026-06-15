import type {
  DetectionStats,
  SelectedCell,
  TabDetectionResult,
  TabEvent,
  TabNote,
  TabStaff,
  TabStringLabel,
} from './tab.types';
import { TAB_STRINGS } from './tab.types';

function toObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeStringLabel(raw: unknown, fallbackIndex: number): TabStringLabel {
  if (typeof raw === 'string') {
    const matchedIndex = TAB_STRINGS.findIndex((label) => label.toLowerCase() === raw.toLowerCase());
    if (matchedIndex >= 0) {
      return TAB_STRINGS[matchedIndex];
    }
  }

  return TAB_STRINGS[fallbackIndex] ?? 'E';
}

function normalizeStringIndex(raw: unknown): number | null {
  const numeric = toNullableNumber(raw);
  if (numeric === null) {
    return null;
  }

  if (numeric >= 1 && numeric <= 6) {
    return numeric - 1;
  }

  if (numeric >= 0 && numeric < 6) {
    return numeric;
  }

  return null;
}

function normalizeEvent(event: unknown, staffIndex: number, eventIndex: number): TabEvent {
  const source = toObject(event);
  const rawFretMap = toObject(source.string_fret_map);
  const rawNoteIdMap = toObject(source.string_note_id_map);

  const stringFretMap = TAB_STRINGS.reduce<Record<string, number | null>>((acc, label, stringIndex) => {
    const candidates = [
      rawFretMap[label],
      rawFretMap[label.toLowerCase()],
      rawFretMap[label.toUpperCase()],
      rawFretMap[String(stringIndex)],
      rawFretMap[String(stringIndex + 1)],
    ];

    const match = candidates.find((value) => value !== undefined);
    acc[label] = toNullableNumber(match);
    return acc;
  }, {});

  const stringNoteIdMap = TAB_STRINGS.reduce<Record<string, string | null>>((acc, label, stringIndex) => {
    const candidates = [
      rawNoteIdMap[label],
      rawNoteIdMap[label.toLowerCase()],
      rawNoteIdMap[label.toUpperCase()],
      rawNoteIdMap[String(stringIndex)],
      rawNoteIdMap[String(stringIndex + 1)],
    ];

    const match = candidates.find((value) => value !== undefined);
    acc[label] = typeof match === 'string' && match.trim() ? match : null;
    return acc;
  }, {});

  return {
    ...source,
    id: typeof source.id === 'string' && source.id.trim() ? source.id : `staff-${staffIndex}-event-${eventIndex}`,
    event_index: normalizeStringIndex(source.event_index) ?? toNullableNumber(source.event_index) ?? eventIndex,
    x_center: toNullableNumber(source.x_center),
    duration_beats: toNullableNumber(source.duration_beats),
    string_fret_map: stringFretMap,
    string_note_id_map: stringNoteIdMap,
  };
}

function normalizeStaff(staff: unknown, staffIndex: number): TabStaff {
  const source = toObject(staff);
  const events = Array.isArray(source.events) ? source.events : [];

  return {
    ...source,
    id: typeof source.id === 'string' && source.id.trim() ? source.id : `staff-${staffIndex}`,
    staff_index: toNullableNumber(source.staff_index) ?? staffIndex,
    label: typeof source.label === 'string' ? source.label : null,
    events: events.map((event, eventIndex) => normalizeEvent(event, staffIndex, eventIndex)),
  };
}

function normalizeNote(note: unknown, noteIndex: number): TabNote {
  const source = toObject(note);
  const stringIndex = normalizeStringIndex(source.string_index ?? source.string_number ?? source.string) ?? 0;
  const staffIndex = toNullableNumber(source.staff_index) ?? 0;
  const eventIndex = toNullableNumber(source.event_index) ?? 0;
  const confidence = toNullableNumber(source.confidence);
  const uncertainFromFlag = Boolean(source.uncertain ?? source.is_uncertain);
  const uncertainFromConfidence = confidence !== null && confidence < 0.8;

  return {
    id: typeof source.id === 'string' && source.id.trim() ? source.id : `note-${noteIndex}`,
    staff_index: staffIndex,
    event_index: eventIndex,
    string_index: stringIndex,
    string_label: normalizeStringLabel(source.string_label ?? source.string_name ?? source.string, stringIndex),
    fret: toNullableNumber(source.fret),
    note_name: typeof source.note_name === 'string' ? source.note_name : null,
    midi: toNullableNumber(source.midi),
    confidence,
    uncertain: uncertainFromFlag || uncertainFromConfidence,
    x_center: toNullableNumber(source.x_center),
    y_center: toNullableNumber(source.y_center),
    source,
  };
}

export function normalizeDetectionResult(payload: unknown): TabDetectionResult {
  const source = toObject(payload);
  const staffs = Array.isArray(source.staffs) ? source.staffs.map((staff, index) => normalizeStaff(staff, index)) : [];
  const notes = Array.isArray(source.notes) ? source.notes.map((note, index) => normalizeNote(note, index)) : [];
  const events = Array.isArray(source.events)
    ? source.events.map((event, index) => normalizeEvent(event, -1, index))
    : staffs.flatMap((staff) => staff.events);

  return {
    ...source,
    metadata: toObject(source.metadata),
    notes,
    staffs,
    events,
    debug: toObject(source.debug),
    image_url: typeof source.image_url === 'string' ? source.image_url : null,
  } as TabDetectionResult;
}

export function computeDetectionStats(result: TabDetectionResult | null): DetectionStats {
  if (!result) {
    return {
      staff_count: 0,
      event_count_total: 0,
      note_count_after_dedup: 0,
      uncertain_note_count: 0,
    };
  }

  return {
    staff_count: result.staffs.length,
    event_count_total: result.staffs.reduce((sum, staff) => sum + staff.events.length, 0),
    note_count_after_dedup: result.notes.length,
    uncertain_note_count: result.notes.filter((note) => note.uncertain).length,
  };
}

export function getSelectedEvent(result: TabDetectionResult | null, selectedCell: SelectedCell | null) {
  if (!result || !selectedCell) {
    return null;
  }

  return result.staffs[selectedCell.staffIndex]?.events[selectedCell.eventIndex] ?? null;
}

export function getNotesForEvent(result: TabDetectionResult | null, staffIndex: number, eventIndex: number) {
  if (!result) {
    return [];
  }

  return result.notes.filter((note) => note.staff_index === staffIndex && note.event_index === eventIndex);
}

export function updateCellFret(
  result: TabDetectionResult,
  selection: SelectedCell,
  nextValue: number | null,
) {
  const nextStaffs = result.staffs.map((staff, staffIndex) => {
    if (staffIndex !== selection.staffIndex) {
      return staff;
    }

    return {
      ...staff,
      events: staff.events.map((event, eventIndex) => {
        if (eventIndex !== selection.eventIndex) {
          return event;
        }

        const stringLabel = TAB_STRINGS[selection.stringIndex];
        return {
          ...event,
          string_fret_map: {
            ...event.string_fret_map,
            [stringLabel]: nextValue,
          },
        };
      }),
    };
  });

  const nextNotes = result.notes.map((note) => {
    if (
      note.staff_index === selection.staffIndex
      && note.event_index === selection.eventIndex
      && note.string_index === selection.stringIndex
    ) {
      return {
        ...note,
        fret: nextValue,
      };
    }

    return note;
  });

  return {
    ...result,
    staffs: nextStaffs,
    notes: nextNotes,
  };
}

export function appendEvent(result: TabDetectionResult, staffIndex: number) {
  return {
    ...result,
    staffs: result.staffs.map((staff, index) => {
      if (index !== staffIndex) {
        return staff;
      }

      const nextEventIndex = staff.events.length;
      return {
        ...staff,
        events: [
          ...staff.events,
          {
            id: `staff-${staffIndex}-event-${nextEventIndex}`,
            event_index: nextEventIndex,
            x_center: null,
            duration_beats: null,
            string_fret_map: TAB_STRINGS.reduce<Record<string, null>>((acc, label) => {
              acc[label] = null;
              return acc;
            }, {}),
            string_note_id_map: TAB_STRINGS.reduce<Record<string, null>>((acc, label) => {
              acc[label] = null;
              return acc;
            }, {}),
          },
        ],
      };
    }),
  };
}

export function removeEvent(result: TabDetectionResult, staffIndex: number, eventIndex: number) {
  const nextStaffs = result.staffs.map((staff, index) => {
    if (index !== staffIndex) {
      return staff;
    }

    return {
      ...staff,
      events: staff.events
        .filter((_, currentIndex) => currentIndex !== eventIndex)
        .map((event, nextIndex) => ({
          ...event,
          event_index: nextIndex,
          id: `staff-${staffIndex}-event-${nextIndex}`,
        })),
    };
  });

  const nextNotes = result.notes.filter(
    (note) => !(note.staff_index === staffIndex && note.event_index === eventIndex),
  ).map((note) => {
    if (note.staff_index === staffIndex && note.event_index > eventIndex) {
      return {
        ...note,
        event_index: note.event_index - 1,
      };
    }

    return note;
  });

  return {
    ...result,
    staffs: nextStaffs,
    notes: nextNotes,
  };
}
