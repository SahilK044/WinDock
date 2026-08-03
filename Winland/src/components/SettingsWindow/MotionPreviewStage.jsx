import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import DeviceModel3D from '../Activities/DeviceModel3D';
import { engineCategoryFor } from '../../data/devicePrefs';

/**
 * The preview stage: the real device you picked, performing the motion style
 * you picked, on a lit pedestal.
 *
 * Selecting a style remounts the renderer via `runId`, which restarts the entry
 * animation — so a click plays the motion from the top rather than dropping you
 * into the middle of its idle loop. Only one WebGL context ever lives here, so
 * the whole tab costs about the same as a single device card.
 */
export default function MotionPreviewStage({
  modelId,
  prefCategory,
  animStyle,
  deviceName,
  styleName,
}) {
  const [runId, setRunId] = useState(0);
  const mountedRef = useRef(false);

  // Replay when the device or its motion changes — but not on first mount,
  // where the entry animation is already about to play.
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setRunId((n) => n + 1);
  }, [modelId, animStyle]);

  return (
    <div className="wl-stage">
      <div className="wl-stage-glow" aria-hidden="true" />

      <div className="wl-stage-viewport">
        {/* Inside the viewport so it anchors to the device, not the whole card. */}
        <div className="wl-stage-floor" aria-hidden="true" />
        {modelId ? (
          <DeviceModel3D
            key={`${modelId}-${animStyle}-${runId}`}
            modelId={modelId}
            category={engineCategoryFor(prefCategory)}
            styleCategory={prefCategory}
            animStyle={animStyle}
            size={210}
            loop
            fit={0.68}
          />
        ) : (
          <div className="wl-stage-empty">Pick a device to preview it here.</div>
        )}
      </div>

      <div className="wl-stage-bar">
        <div className="wl-stage-meta">
          <span className="wl-stage-device">{deviceName || '—'}</span>
          <span className="wl-stage-style">{styleName || 'No motion selected'}</span>
        </div>
        <button
          type="button"
          className="wl-replay"
          onClick={() => setRunId((n) => n + 1)}
          disabled={!modelId}
        >
          <RotateCw size={13} strokeWidth={2.4} />
          Replay
        </button>
      </div>
    </div>
  );
}
