import './globals.css';
import { Sidebar } from '@/components/layout/Shell';
import { Providers } from './providers';

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
        <html lang="en">
            <body className="min-h-screen bg-[#f3f4f6]">
                <Providers>
                    <Sidebar />
                    <main className="pl-28 pr-8 py-8 min-h-screen">
                        <div className="max-w-[1600px] mx-auto">
                            {children}
                        </div>
                    </main>
                </Providers>
            </body>
        </html>
    )
}
