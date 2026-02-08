/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                    950: '#042f2e',
                },
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            animation: {
                'fadeIn': 'fadeIn 0.3s ease-out',
                'fadeInUp': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'slideInRight': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'scaleIn': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                fadeInUp: {
                    from: {
                        opacity: '0',
                        transform: 'translateY(12px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                slideInRight: {
                    from: {
                        opacity: '0',
                        transform: 'translateX(-10px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateX(0)',
                    },
                },
                scaleIn: {
                    from: {
                        opacity: '0',
                        transform: 'scale(0.95)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'scale(1)',
                    },
                },
            },
        },
    },
    plugins: [],
}