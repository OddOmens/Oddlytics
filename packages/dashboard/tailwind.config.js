/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                background: '#f3f4f6', // Light gray background like image
                card: '#ffffff',
                primary: '#E86C4F', // Orange/Salmon accent from image
                secondary: '#1F2937', // Dark gray/black
                subtle: '#9CA3AF', // Gray text
            },
            borderRadius: {
                '3xl': '1.5rem', // Soft rounded corners
                'bento': '2rem',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            }
        },
    },
    plugins: [],
}
