'use client';

import { SettingsProvider } from '@/lib/settings';
import { AliasProvider } from '@/lib/alias';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SettingsProvider>
            <AliasProvider>
                {children}
            </AliasProvider>
        </SettingsProvider>
    );
}
