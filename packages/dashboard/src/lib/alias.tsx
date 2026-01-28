'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

interface Alias {
    app_id: string;
    event_name: string;
    alias: string;
}

interface AliasContextType {
    aliases: Alias[];
    getAlias: (appId: string, eventName: string) => string | null;
    saveAlias: (appId: string, eventName: string, alias: string) => Promise<void>;
    removeAlias: (appId: string, eventName: string) => Promise<void>;
    refreshAliases: () => Promise<void>;
}

const AliasContext = createContext<AliasContextType>({
    aliases: [],
    getAlias: () => null,
    saveAlias: async () => { },
    removeAlias: async () => { },
    refreshAliases: async () => { },
});

export function AliasProvider({ children }: { children: React.ReactNode }) {
    const [aliases, setAliases] = useState<Alias[]>([]);

    useEffect(() => {
        refreshAliases();
    }, []);

    const refreshAliases = async () => {
        try {
            const data = await api.getAliases();
            setAliases(data.aliases);
        } catch (e) {
            console.error('Failed to load aliases', e);
        }
    };

    const getAlias = (appId: string, eventName: string) => {
        const found = aliases.find(a => a.app_id === appId && a.event_name === eventName);
        return found ? found.alias : null;
    };

    const saveAlias = async (appId: string, eventName: string, alias: string) => {
        // Optimistic update
        const newAliases = aliases.filter(a => !(a.app_id === appId && a.event_name === eventName));
        newAliases.push({ app_id: appId, event_name: eventName, alias });
        setAliases(newAliases);

        try {
            await api.upsertAlias(appId, eventName, alias);
        } catch (e) {
            console.error('Failed to save alias', e);
            refreshAliases(); // Revert on error
        }
    };

    const removeAlias = async (appId: string, eventName: string) => {
        // Optimistic update
        setAliases(aliases.filter(a => !(a.app_id === appId && a.event_name === eventName)));

        try {
            await api.deleteAlias(appId, eventName);
        } catch (e) {
            console.error('Failed to delete alias', e);
            refreshAliases(); // Revert
        }
    };

    return (
        <AliasContext.Provider value={{ aliases, getAlias, saveAlias, removeAlias, refreshAliases }}>
            {children}
        </AliasContext.Provider>
    );
}

export const useAliases = () => useContext(AliasContext);
