import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
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
            <body className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Oddlytics
                                </h1>
                            </div>
                        </div>
                    </div>
                </nav>
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </body>
        </html>
    )
}
