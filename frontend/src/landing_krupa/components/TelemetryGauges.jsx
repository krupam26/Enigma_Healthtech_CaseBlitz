import React from 'react';
import { Activity, ShieldCheck, BatteryCharging, ScanLine, ArrowUpRight } from 'lucide-react';

function CircularGauge({ value, min = 0, max = 100, label, subtext, color = '#10e598', unit = '%' }) {
  const norm = (value - min) / (max - min);
  // Needle angle from -120deg to +120deg (240 deg total span)
  const angle = -120 + norm * 240;

  // Arc path from -120deg to +120deg (radius = 70, cx = 100, cy = 100)
  // Let's create an SVG arc
  const startAngle = (-120 * Math.PI) / 180;
  const endAngle = (120 * Math.PI) / 180;
  const currentAngle = (angle * Math.PI) / 180;

  const r = 70;
  const cx = 100;
  const cy = 100;

  const sx = cx + r * Math.sin(startAngle);
  const sy = cy - r * Math.cos(startAngle);

  const ex = cx + r * Math.sin(endAngle);
  const ey = cy - r * Math.cos(endAngle);

  const currX = cx + r * Math.sin(currentAngle);
  const currY = cy - r * Math.cos(currentAngle);

  const bgPath = `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
  const largeArcFlag = norm > 0.5 ? 1 : 0;
  const activePath = `M ${sx} ${sy} A ${r} ${r} 0 ${largeArcFlag} 1 ${currX} ${currY}`;

  return (
    <div className="gauge-card">
      <div className="gauge-svg-wrap">
        <svg viewBox="0 0 200 180" className="gauge-svg">
          {/* Defs for gradients */}
          <defs>
            <linearGradient id={`gauge-grad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Arc */}
          <path
            d={bgPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Glowing Arc */}
          <path
            d={activePath}
            fill="none"
            stroke={`url(#gauge-grad-${label})`}
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#gauge-glow)"
          />

          {/* Center Hub */}
          <circle cx="100" cy="100" r="8" fill="#121820" stroke={color} strokeWidth="2.5" />

          {/* Needle */}
          <g
            style={{
              transformOrigin: '100px 100px',
              transform: `rotate(${angle}deg)`,
              transition: 'transform 1.4s cubic-bezier(0.2, 0.9, 0.3, 1.2)'
            }}
          >
            <polygon points="98,100 102,100 100.5,35 99.5,35" fill="#f8fafc" />
            <polygon points="99,35 101,35 100,28" fill={color} />
          </g>

          {/* Ticks */}
          {[-120, -60, 0, 60, 120].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = cx + (r - 12) * Math.sin(rad);
            const y1 = cy - (r - 12) * Math.cos(rad);
            const x2 = cx + (r - 18) * Math.sin(rad);
            const y2 = cy - (r - 18) * Math.cos(rad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        <div className="gauge-readout">
          <span className="gauge-val" style={{ color }}>{value}</span>
          <span className="gauge-unit">{unit}</span>
        </div>
      </div>

      <div className="gauge-info">
        <span className="gauge-label">{label}</span>
        <span className="gauge-sub">{subtext}</span>
      </div>
    </div>
  );
}

export default function TelemetryGauges() {
  return (
    <section className="section-padding gauges-section">
      <div className="site-container">
        <div className="gauges-header">
          <div className="section-eyebrow">
            <span className="eyebrow-line"></span>
            CLINICAL INSTRUMENTATION
          </div>
          <h2 className="section-title">
            REAL-TIME <span className="gradient-text">TELEMETRY CLUSTER</span>
          </h2>
          <p className="section-description">
            Continuous verification metrics running over your active medication regimen, adherence patterns, and supply runaways.
          </p>
        </div>

        <div className="gauges-grid">
          <CircularGauge
            value={87}
            min={0}
            max={100}
            unit="%"
            color="#10e598"
            label="Adherence Health Score"
            subtext="Morning 94% · Afternoon 82% · Night 71%"
          />
          <CircularGauge
            value={100}
            min={0}
            max={100}
            unit="%"
            color="#00d4ff"
            label="Safety Radar Shield"
            subtext="0 High-Risk Drug Interactions Detected"
          />
          <CircularGauge
            value={6}
            min={0}
            max={30}
            unit="DAYS"
            color="#f59e0b"
            label="Refill Runway"
            subtext="Metformin: 6 days left (Refill approaching)"
          />
          <CircularGauge
            value={98.6}
            min={50}
            max={100}
            unit="%"
            color="#38bdf8"
            label="Prescription Confidence"
            subtext="Multi-field OCR extraction verified"
          />
        </div>
      </div>
    </section>
  );
}
