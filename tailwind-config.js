(function applyTailwindConfig() {
    const config = {
        darkMode: 'class',
        theme: {
            extend: {
                fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                    heading: ['Poppins', 'sans-serif']
                },
                colors: {
                    primary: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#0066cc', 700: '#1d4ed8', 900: '#1e3a8a' },
                    secondary: '#00a89a',
                    dark: '#0f1724',
                    surface: '#f8fafc'
                }
            }
        }
    };

    if (window.tailwind && typeof window.tailwind === 'object') {
        window.tailwind.config = config;
    } else {
        window.tailwind = { config };
    }
})();
