import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { toggleAmbientSound, playChime } from '../utils/soundEngine';

export default function AmbientAudioControl() {
  const [isActive, setIsActive] = useState(false);

  const handleToggle = () => {
    const newState = toggleAmbientSound();
    setIsActive(newState);
    if (newState) {
      playChime(640, 'triangle', 0.2);
    }
  };

  return (
    <button 
      type="button" 
      className={`sound-fab ${isActive ? 'sound-fab--on' : ''}`}
      onClick={handleToggle}
      title={isActive ? 'Mute ambient soundscape' : 'Enable clinical soundscape'}
    >
      {isActive ? (
        <Volume2 size={16} className="sound-icon" />
      ) : (
        <VolumeX size={16} className="sound-icon" />
      )}
      
      <span className="sound-label">
        {isActive ? 'AUDIO ACTIVE' : 'SOUNDSCAPE'}
      </span>

      <div className="sound-eq-bars">
        <i className="bar1"></i>
        <i className="bar2"></i>
        <i className="bar3"></i>
      </div>
    </button>
  );
}
