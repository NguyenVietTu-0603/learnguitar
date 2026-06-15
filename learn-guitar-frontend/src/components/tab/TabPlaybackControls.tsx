import type { PlaybackState } from '../../features/tab/useTabPlayback';

interface TabPlaybackControlsProps {
  playbackState: PlaybackState;
  currentTick: number;
  totalEvents: number;
  tempo: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTempoChange: (tempo: number) => void;
  onSeek: (eventIndex: number) => void;
}

export default function TabPlaybackControls({
  playbackState,
  currentTick,
  totalEvents,
  tempo,
  onPlay,
  onPause,
  onResume,
  onStop,
  onTempoChange,
  onSeek,
}: TabPlaybackControlsProps) {
  const isPlaying = playbackState === 'playing';
  const isPaused = playbackState === 'paused';
  const isStopped = playbackState === 'stopped';
  const progress = totalEvents > 0 ? (currentTick / totalEvents) * 100 : 0;

  const formatTime = () => {
    if (!totalEvents) return '0:00';
    const beatsPerBar = 4;
    const currentBar = Math.floor(currentTick / beatsPerBar) + 1;
    const beat = (currentTick % beatsPerBar) + 1;
    return `${currentBar}:${beat}`;
  };

  return (
    <div className="tab-playback">
      <div className="tab-playback__header">
        <p className="tab-kicker">Playback</p>
        <span className="tab-playback__time">{formatTime()}</span>
      </div>

      {/* Timeline scrubber */}
      <div className="tab-playback__timeline">
        <input
          type="range"
          className="tab-playback__scrubber"
          min={0}
          max={Math.max(0, totalEvents - 1)}
          value={currentTick}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={totalEvents === 0}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        />
        <div className="tab-playback__tick-marks">
          {Array.from({ length: Math.min(totalEvents, 32) }, (_, i) => (
            <div
              key={i}
              className={`tab-playback__tick ${i % 4 === 0 ? 'tab-playback__tick--major' : ''}`}
              style={{ left: `${(i / totalEvents) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Transport controls */}
      <div className="tab-playback__controls">
        <button
          className="tab-playback__btn tab-playback__btn--secondary"
          onClick={onStop}
          disabled={isStopped && currentTick === 0}
          title="Stop"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor" />
          </svg>
        </button>

        {isPlaying ? (
          <button className="tab-playback__btn tab-playback__btn--primary" onClick={onPause} title="Pause">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor" />
              <rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <button
            className="tab-playback__btn tab-playback__btn--primary"
            onClick={isPaused ? onResume : onPlay}
            disabled={totalEvents === 0}
            title={isPaused ? 'Resume' : 'Play'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 2.5L13 8L4 13.5V2.5Z" fill="currentColor" />
            </svg>
          </button>
        )}

        <div className="tab-playback__tempo">
          <label className="tab-playback__tempo-label">BPM</label>
          <input
            type="number"
            className="tab-playback__tempo-input"
            value={tempo}
            min={30}
            max={240}
            onChange={(e) => onTempoChange(Math.max(30, Math.min(240, Number(e.target.value))))}
          />
        </div>
      </div>
    </div>
  );
}
