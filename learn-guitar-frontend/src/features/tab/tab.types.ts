export const TAB_STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'] as const;

export type TabStringLabel = (typeof TAB_STRINGS)[number];

export interface TabMetadata {
  title?: string | null;
  tab_id?: string | null;
  source_filename?: string | null;
  detected_at?: string | null;
  model?: string | null;
  processing_ms?: number | null;
  image_width?: number | null;
  image_height?: number | null;
  [key: string]: unknown;
}

export interface TabNote {
  id: string;
  staff_index: number;
  event_index: number;
  string_index: number;
  string_label: TabStringLabel;
  fret: number | null;
  note_name?: string | null;
  midi?: number | null;
  confidence?: number | null;
  uncertain?: boolean;
  x_center?: number | null;
  y_center?: number | null;
  source?: Record<string, unknown>;
}

export interface TabEvent {
  id: string;
  event_index: number;
  x_center?: number | null;
  duration_beats?: number | null;
  string_fret_map: Record<string, number | null | undefined>;
  string_note_id_map?: Record<string, string | null | undefined>;
  [key: string]: unknown;
}

export interface TabStaff {
  id: string;
  staff_index: number;
  label?: string | null;
  events: TabEvent[];
  [key: string]: unknown;
}

export interface TabDetectionResult {
  metadata: TabMetadata;
  notes: TabNote[];
  staffs: TabStaff[];
  events?: TabEvent[];
  debug?: Record<string, unknown>;
  image_url?: string | null;
  [key: string]: unknown;
}

export interface TabDetectionResponse {
  result: TabDetectionResult;
  saved_json_path?: string | null;
  uploaded_image_path?: string | null;
  annotated_image_path?: string | null;
  [key: string]: unknown;
}

export interface TabRenderResponse {
  ascii_tab: string;
  grid?: unknown;
}

export interface TabSaveResponse {
  tab_id: string;
  message?: string;
}

export interface DetectionStats {
  staff_count: number;
  event_count_total: number;
  note_count_after_dedup: number;
  uncertain_note_count: number;
}

export interface SelectedCell {
  staffIndex: number;
  eventIndex: number;
  stringIndex: number;
}

export interface SelectedEventRef {
  staffIndex: number;
  eventIndex: number;
}
