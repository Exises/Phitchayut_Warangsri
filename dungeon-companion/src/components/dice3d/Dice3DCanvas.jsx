import React from 'react';

export default function Dice3DCanvas() {
  return (
    <div
      id="dice-3d-overlay-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Critical: allows clicking underlying buttons while canvas renders
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      <div id="dice-box-canvas" style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
}
