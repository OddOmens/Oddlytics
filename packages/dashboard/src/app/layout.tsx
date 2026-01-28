import './globals.css';
import { MainLayout } from '@/components/layout/MainLayout';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const metadata = {
    title: 'Oddlytics Dashboard',
    description: 'Privacy-first analytics for iOS apps',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen">
                <Providers>
                    <MainLayout>
                        {children}
                    </MainLayout>
                    <Toaster richColors position="top-right" />
                </Providers>
            </body>
        </html>
    )
}
