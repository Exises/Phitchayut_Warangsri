import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const defaultSettings = {
        diceTheme: 'divine-marble', // 'divine-marble', 'obsidian', 'mystic'
        diceSoundEnabled: true,
        diceSoundVolume: 0.5,
        enable3DDice: true,
        showDebugView: false
    };

    const [settings, setSettings] = useState(() => {
        const stored = localStorage.getItem('dnd_settings');
        if (stored) {
            try {
                return { ...defaultSettings, ...JSON.parse(stored) };
            } catch (e) {
                return defaultSettings;
            }
        }
        return defaultSettings;
    });

    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('dnd_settings', JSON.stringify(settings));
        
        // Force classic theme since app theme feature was removed
        document.body.className = `theme-classic`;
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};
