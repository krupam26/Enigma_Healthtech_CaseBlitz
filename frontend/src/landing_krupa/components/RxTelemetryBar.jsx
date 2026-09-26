import React from 'react';
import { Pill, Activity, ShieldCheck } from 'lucide-react';

export default function RxTelemetryBar({ scrollProgress = 0 }) {
  const percent = Math.min(100, Math.max(0, Math.round(scrollProgress * 100)));

  return (
    <div className="telemetry-bar" aria-hidden="true">
      <div className="telemetry-left">
        <span className="telemetry-code">RX-CORE // #MC-KRUPA-902</span>
        <span className="telemetry-divider">/</span>
        <span className="telemetry-tag">
          <Activity size={10} className="pulse-icon" /> PATIENT ADHERENCE: 87%
        </span>
      </div>

      <div className="telemetry-track-wrap">
        <div className="telemetry-line">
          <div 
            className="telemetry-line-fill" 
            style={{ width: `${percent}%` }}
          />
          <div 
            className="telemetry-pill-head"
            style={{ left: `calc(${percent}% - 10px)` }}
          >
            <Pill size={12} className="pill-head-icon" />
          </div>
        </div>
      </div>

      <div className="telemetry-right">
        <span className="telemetry-status">
          <ShieldCheck size={11} className="text-emerald" /> 0 DRUG-DRUG CONFLICTS
        </span>
        <span className="telemetry-percent">{percent}% CYCLE</span>
      </div>
    </div>
  );
}
