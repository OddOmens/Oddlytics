'use client';

import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '@/lib/settings';
import { AliasProvider } from '@/lib/alias';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
            <SettingsProvider>
                <AliasProvider>
                    {children}
                </AliasProvider>
            </SettingsProvider>
        </ThemeProvider>
    );
}
