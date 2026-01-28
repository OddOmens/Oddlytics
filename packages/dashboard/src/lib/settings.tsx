'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
    prettyEventNames: boolean;
    setPrettyEventNames: (value: boolean) => void;
    formatEventName: (name: string) => string;
}

const SettingsContext = createContext<SettingsContextType>({
    prettyEventNames: false,
    setPrettyEventNames: () => { },
    formatEventName: (name) => name,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [prettyEventNames, setPrettyEventNamesState] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('oddlytics_settings_pretty_names');
        if (stored) {
            setPrettyEventNamesState(JSON.parse(stored));
        }
        setMounted(true);
    }, []);

    const setPrettyEventNames = (value: boolean) => {
        setPrettyEventNamesState(value);
        localStorage.setItem('oddlytics_settings_pretty_names', JSON.stringify(value));
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
        <SettingsContext.Provider value={{ prettyEventNames, setPrettyEventNames, formatEventName }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
