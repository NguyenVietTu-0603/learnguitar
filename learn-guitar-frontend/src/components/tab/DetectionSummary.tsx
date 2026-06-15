import AppCard from '../common/AppCard';
import type { DetectionStats } from '../../features/tab/tab.types';

interface DetectionSummaryProps {
  stats: DetectionStats;
}

const statItems: Array<{ key: keyof DetectionStats; label: string }> = [
  { key: 'staff_count', label: 'Staffs' },
  { key: 'note_count_after_dedup', label: 'Notes' },
  { key: 'event_count_total', label: 'Events' },
  { key: 'uncertain_note_count', label: 'Uncertain' },
];

export default function DetectionSummary({ stats }: DetectionSummaryProps) {
  return (
    <AppCard className="tab-shell-card">
      <div className="tab-panel-heading">
        <p className="tab-kicker">Summary</p>
        <h3>Recognition stats</h3>
      </div>

      <div className="tab-summary-grid">
        {statItems.map((item) => (
          <div key={item.key} className="tab-stat-card">
            <span>{item.label}</span>
            <strong>{stats[item.key]}</strong>
          </div>
        ))}
      </div>
    </AppCard>
  );
}
