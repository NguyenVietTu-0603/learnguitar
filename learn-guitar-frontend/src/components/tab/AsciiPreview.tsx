import AppCard from '../common/AppCard';

interface AsciiPreviewProps {
  ascii: string;
  isLoading: boolean;
}

export default function AsciiPreview({ ascii, isLoading }: AsciiPreviewProps) {
  return (
    <AppCard className="tab-shell-card tab-shell-card--ascii">
      <div className="tab-panel-heading tab-panel-heading--row">
        <div>
          <p className="tab-kicker">Preview</p>
          <h3>ASCII tab</h3>
        </div>
        {isLoading ? <span className="tab-status-pill is-busy">Rendering</span> : null}
      </div>

      <div className="tab-ascii-frame">
        {ascii ? (
          <pre className="tab-ascii-text">{ascii}</pre>
        ) : (
          <div className="tab-ascii-empty">
            <strong>ASCII preview chưa sẵn sàng</strong>
            <span>Preview text sẽ xuất hiện sau khi AI detect hoặc khi bạn chỉnh sửa grid.</span>
          </div>
        )}
      </div>
    </AppCard>
  );
}
