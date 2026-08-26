import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';

const Dice3DContext = createContext(null);


export function Dice3DProvider({ children }) {
  const { settings } = useSettings();
  const diceBoxRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  
  // Synthetic dice sound generator
  const playDiceSound = () => {
    if (!settings.diceSoundEnabled) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(settings.diceSoundVolume || 0.5, ctx.currentTime);
      envelope.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      noiseSource.connect(filter);
      filter.connect(envelope);
      envelope.connect(ctx.destination);
      
      noiseSource.start();
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  };
  // Update theme when settings change
  useEffect(() => {
    if (diceBoxRef.current && isReady) {
      let themeColor = '#d97706';
      let theme = 'default';

      switch(settings.diceTheme) {
        case 'obsidian': themeColor = '#dc2626'; theme = 'default'; break;
        case 'mystic': themeColor = '#06b6d4'; theme = 'default'; break;
        case 'fire': themeColor = '#ff4500'; theme = 'default'; break; // 'fire' doesn't exist, use default tinted
        case 'ice': themeColor = '#00ffff'; theme = 'smooth'; break;
        case 'gem': themeColor = '#10b981'; theme = 'gemstone'; break;
        case 'wood': themeColor = '#8b4513'; theme = 'wooden'; break;
        case 'metal': themeColor = '#71717a'; theme = 'blueGreenMetal'; break;
        case 'glass': themeColor = '#f8fafc'; theme = 'smooth'; break;
        case 'water': themeColor = '#3b82f6'; theme = 'smooth'; break;
        case 'earth': themeColor = '#78716c'; theme = 'rock'; break;
        case 'air': themeColor = '#e2e8f0'; theme = 'smooth'; break;
        case 'rust': themeColor = '#b45309'; theme = 'rust'; break;
        default: themeColor = '#d97706'; theme = 'default'; break; // divine-marble
      }
      
      try {
        diceBoxRef.current.updateConfig({
            theme: theme,
            themeColor: themeColor
        });
      } catch (e) {
        console.warn("Could not update dice theme config:", e);
      }
    }
  }, [settings.diceTheme, isReady]);

  useEffect(() => {
    let isMounted = true;
    const initDiceBox = async () => {
      try {
        if (typeof window === 'undefined') return;
        const container = document.getElementById('dice-box-canvas');
        if (!container) return;

        // Determine base path for XAMPP (/dnd-companion/) vs Vite Dev (/)
        const basePath = window.location.pathname.includes('/dnd-companion')
          ? '/dnd-companion/assets/dice-box/'
          : '/assets/dice-box/';

        let initThemeColor = '#d97706';
        let initTheme = 'default';

        switch(settings.diceTheme) {
          case 'obsidian': initThemeColor = '#dc2626'; initTheme = 'default'; break;
          case 'mystic': initThemeColor = '#06b6d4'; initTheme = 'default'; break;
          case 'fire': initThemeColor = '#ff4500'; initTheme = 'default'; break;
          case 'ice': initThemeColor = '#00ffff'; initTheme = 'smooth'; break;
          case 'gem': initThemeColor = '#10b981'; initTheme = 'gemstone'; break;
          case 'wood': initThemeColor = '#8b4513'; initTheme = 'wooden'; break;
          case 'metal': initThemeColor = '#71717a'; initTheme = 'blueGreenMetal'; break;
          case 'glass': initThemeColor = '#f8fafc'; initTheme = 'smooth'; break;
          case 'water': initThemeColor = '#3b82f6'; initTheme = 'smooth'; break;
          case 'earth': initThemeColor = '#78716c'; initTheme = 'rock'; break;
          case 'air': initThemeColor = '#e2e8f0'; initTheme = 'smooth'; break;
          case 'rust': initThemeColor = '#b45309'; initTheme = 'rust'; break;
          default: initThemeColor = '#d97706'; initTheme = 'default'; break; // divine-marble
        }

        // Dynamically import DiceBox to prevent blocking initial load
        const { default: DiceBox } = await import('@3d-dice/dice-box');

        const box = new DiceBox({
          container: "#dice-box-canvas",
          assetPath: basePath,
          theme: initTheme,
          themeColor: initThemeColor,
          scale: 4, // Comfortable visible size without being overwhelming
          gravity: 5.5,
          mass: 1,
          friction: 0.8,
          restitution: 0.5,
          spinForce: 8,
          throwForce: 5.5, // Reduced throw force slightly so they don't bounce off screen too fast
          startingHeight: 12, // Higher drop so they don't clip through the camera


          settleTimeout: 5000,
          sounds: true
        });

        await box.init();
        if (isMounted) {
          diceBoxRef.current = box;
          setIsReady(true);
          // Force a resize event so dice-box recalculates canvas dimensions
          // This is critical: without it, the physics worker uses default 150x150
          // instead of the actual full-viewport dimensions from our CSS
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
        }
      } catch (err) {
        console.warn("DiceBox 3D init warning:", err);
      }
    };

    // Small delay to ensure Dice3DCanvas DOM node is attached
    const timer = setTimeout(initDiceBox, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Main roll3D function triggered by any roll action in the app
  const roll3D = async ({ formula, notation, onComplete }) => {
    // Play sound immediately if enabled
    playDiceSound();

    const rollNotation = notation || formula || '1d20';
    // Clean notation to standard dice-box syntax (e.g., extract leading XdY if complex formula like 1d20+5)
    let cleanNotation = rollNotation;
    const match = rollNotation.match(/^(\d+[dD]\d+)/);
    if (match) {
      cleanNotation = match[1].toLowerCase();
    } else if (!cleanNotation.includes('d')) {
      cleanNotation = '1d20';
    }

    if (!diceBoxRef.current || !isReady || !settings.enable3DDice) {
      // Fallback if 3D box isn't initialized yet or is disabled by user
      if (onComplete) {
        // Mock a quick random result if 3D dice is disabled
        if (!settings.enable3DDice) {
           const [countStr, sidesStr] = cleanNotation.split('d');
           const count = parseInt(countStr) || 1;
           const sides = parseInt(sidesStr) || 20;
           let rolls = [];
           let total = 0;
           for(let i=0; i<count; i++) {
             const r = Math.floor(Math.random() * sides) + 1;
             rolls.push(r);
             total += r;
           }
           setTimeout(() => {
             onComplete({ total, rolls, rawResults: null });
           }, 500); // slight delay to feel like a roll
        } else {
           onComplete(null);
        }
      }
      return null;
    }

    try {
      setIsRolling(true);
      // Ensure canvas container is visible and active
      const container = document.getElementById('dice-3d-overlay-container');
      if (container) {
        container.style.transition = 'opacity 0.15s ease-in';
        container.style.opacity = '1';
      }

      // Clear any existing fade-out timeouts so we don't accidentally clear newly rolled dice
      if (window.diceFadeTimeout) clearTimeout(window.diceFadeTimeout);
      if (window.diceClearTimeout) clearTimeout(window.diceClearTimeout);

      // Use .roll() to instantly clear old 3D dice when a new roll is initiated
      const results = await diceBoxRef.current.roll(cleanNotation);
      
      // Delay slightly after stop so user enjoys the settled dice before modal pops up
      setTimeout(() => {
        setIsRolling(false);
        if (onComplete) {
          // Flatten all rolls from all groups in the result
          let allRolls = [];
          if (Array.isArray(results)) {
            results.forEach(group => {
              if (group.rollsArray && Array.isArray(group.rollsArray)) {
                allRolls = allRolls.concat(group.rollsArray.map(r => Number(r.value)));
              } else if (group.value !== undefined) {
                allRolls.push(Number(group.value));
              }
            });
          }

          // If somehow allRolls is empty but we have a result, fallback
          if (allRolls.length === 0 && results?.[0]?.value) {
            allRolls.push(Number(results[0].value));
          }

          const totalValue = allRolls.reduce((a, b) => a + b, 0);

          onComplete({
            total: totalValue,
            rolls: allRolls.length > 0 ? allRolls : null,
            rawResults: results
          });
        }

        // After 3 seconds of inactivity, smoothly fade out the dice over 1 second
        window.diceFadeTimeout = setTimeout(() => {
          const overlay = document.getElementById('dice-3d-overlay-container');
          if (overlay) {
            overlay.style.transition = 'opacity 1s ease-out';
            overlay.style.opacity = '0';
            // After fade completes, clear ALL the 3D dice meshes from the screen
            window.diceClearTimeout = setTimeout(() => {
              if (diceBoxRef.current && diceBoxRef.current.clear) {
                diceBoxRef.current.clear();
              }
            }, 1050);
          }
        }, 3000);
      }, 700);

      return results;
    } catch (err) {
      console.warn("DiceBox 3D roll error:", err);
      setIsRolling(false);
      if (onComplete) onComplete(null);
      return null;
    }
  };

  const clearDice = () => {
    if (diceBoxRef.current && diceBoxRef.current.clear) {
      diceBoxRef.current.clear();
    }
  };

  return (
    <Dice3DContext.Provider value={{ roll3D, isReady, isRolling, clearDice, theme: settings.diceTheme, soundEnabled: settings.diceSoundEnabled }}>
      {children}
    </Dice3DContext.Provider>
  );
}

export const useDice3D = () => {
  const context = useContext(Dice3DContext);
  if (!context) {
    return {
      roll3D: async ({ onComplete }) => { if (onComplete) onComplete(null); },
      isReady: false,
      isRolling: false,
      clearDice: () => {}
    };
  }
  return context;
};
