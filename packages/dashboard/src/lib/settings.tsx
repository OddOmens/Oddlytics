'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
    prettyEventNames: boolean;
    setPrettyEventNames: (value: boolean) => void;
    defaultTimeRange: string;
    setDefaultTimeRange: (value: string) => void;
    compactMode: boolean;
    setCompactMode: (value: boolean) => void;
    formatEventName: (name: string) => string;
}

const SettingsContext = createContext<SettingsContextType>({
    prettyEventNames: false,
    setPrettyEventNames: () => { },
    defaultTimeRange: '7d',
    setDefaultTimeRange: () => { },
    compactMode: false,
    setCompactMode: () => { },
    formatEventName: (name) => name,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [prettyEventNames, setPrettyEventNamesState] = useState(false);
    const [defaultTimeRange, setDefaultTimeRangeState] = useState('7d');
    const [compactMode, setCompactModeState] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const storedPretty = localStorage.getItem('oddlytics_settings_pretty_names');
        if (storedPretty) setPrettyEventNamesState(JSON.parse(storedPretty));

        const storedTime = localStorage.getItem('oddlytics_settings_time_range');
        if (storedTime) setDefaultTimeRangeState(storedTime);

        const storedCompact = localStorage.getItem('oddlytics_settings_compact');
        if (storedCompact) setCompactModeState(JSON.parse(storedCompact));

        setMounted(true);
    }, []);

    const setPrettyEventNames = (value: boolean) => {
        setPrettyEventNamesState(value);
        localStorage.setItem('oddlytics_settings_pretty_names', JSON.stringify(value));
    };

    const setDefaultTimeRange = (value: string) => {
        setDefaultTimeRangeState(value);
        localStorage.setItem('oddlytics_settings_time_range', value);
    };

    const setCompactMode = (value: boolean) => {
        setCompactModeState(value);
        localStorage.setItem('oddlytics_settings_compact', JSON.stringify(value));
    };

    const formatEventName = (name: string) => {
        if (!prettyEventNames) return name;

        // Replace underscores and dashes with spaces
        // Split by camelCase
        return name
            .replace(/[_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <SettingsContext.Provider value={{
            prettyEventNames,
            setPrettyEventNames,
            defaultTimeRange,
            setDefaultTimeRange,
            compactMode,
            setCompactMode,
            formatEventName
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
