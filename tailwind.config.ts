import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        aviation: ['Orbitron', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        aviation: {
          sunset: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#FFB347', // Primary brand color
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
            950: '#431407'
          },
          sky: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1E3A8A', // Secondary brand color
            900: '#1e3a8a',
            950: '#172554'
          },
          runway: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617'
          },
          success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
            950: '#052e16'
          },
          warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03'
          },
          danger: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
            950: '#450a0a'
          },
          night: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617'
          }
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in-from-top': 'slideInFromTop 0.3s ease-out',
        'slide-in-from-bottom': 'slideInFromBottom 0.3s ease-out',
        'slide-in-from-left': 'slideInFromLeft 0.3s ease-out',
        'slide-in-from-right': 'slideInFromRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-shift': 'gradientShift 15s ease infinite',
        'rotate-slow': 'rotateSlow 3s linear infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'loading-pulse': 'loadingPulse 1.5s ease-in-out infinite',
        'sunset-glow': 'sunsetGlow 4s ease-in-out infinite',
        'radar-sweep': 'radarSweep 3s linear infinite',
        'altitude-climb': 'altitudeClimb 2s ease-in-out infinite',
        'compass-spin': 'compassSpin 10s linear infinite',
        'fuel-gauge': 'fuelGauge 2s ease-in-out infinite',
        'weather-shift': 'weatherShift 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 179, 71, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 179, 71, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        rotateSlow: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        loadingPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        sunsetGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 30px rgba(255, 179, 71, 0.4)',
            background: 'linear-gradient(135deg, #FFB347, #fb923c)'
          },
          '50%': { 
            boxShadow: '0 0 60px rgba(255, 179, 71, 0.8)',
            background: 'linear-gradient(135deg, #fb923c, #ea580c)'
          },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        altitudeClimb: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.05)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        compassSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fuelGauge: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        weatherShift: {
          '0%': { 
            background: 'linear-gradient(135deg, #FFB347, #1E3A8A)',
            filter: 'brightness(1)'
          },
          '50%': { 
            background: 'linear-gradient(135deg, #1E3A8A, #FFB347)',
            filter: 'brightness(1.2)'
          },
          '100%': { 
            background: 'linear-gradient(135deg, #FFB347, #1E3A8A)',
            filter: 'brightness(1)'
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'aviation': '0 8px 32px rgba(255, 179, 71, 0.15)',
        'aviation-lg': '0 20px 40px rgba(255, 179, 71, 0.2)',
        'aviation-xl': '0 25px 50px rgba(255, 179, 71, 0.25)',
        'sunset': '0 8px 32px rgba(255, 179, 71, 0.2)',
        'sunset-lg': '0 20px 40px rgba(255, 179, 71, 0.3)',
        'sky': '0 8px 32px rgba(30, 58, 138, 0.15)',
        'sky-lg': '0 20px 40px rgba(30, 58, 138, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(255, 179, 71, 0.4)',
        'glow-lg': '0 0 40px rgba(255, 179, 71, 0.6)',
        'night': '0 8px 32px rgba(2, 6, 23, 0.4)',
        'night-lg': '0 20px 40px rgba(2, 6, 23, 0.6)',
      },
      backgroundImage: {
        'gradient-sunset': 'var(--gradient-sunset)',
        'gradient-sky': 'var(--gradient-sky)',
        'gradient-night': 'var(--gradient-night)',
        'gradient-aurora': 'var(--gradient-aurora)',
        'gradient-animated': 'linear-gradient(-45deg, #FFB347, #1E3A8A, #8b5cf6, #ec4899)',
        'gradient-sunset-sky': 'linear-gradient(135deg, #FFB347 0%, #1E3A8A 100%)',
        'gradient-night-sky': 'linear-gradient(135deg, #020617 0%, #1e293b 50%, #334155 100%)',
        'grid-pattern': 'linear-gradient(rgba(255, 179, 71, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 179, 71, 0.1) 1px, transparent 1px)',
        'grid-pattern-dense': 'linear-gradient(rgba(255, 179, 71, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 179, 71, 0.05) 1px, transparent 1px)',
        'radar-pattern': 'radial-gradient(circle at center, rgba(255, 179, 71, 0.1) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '20px 20px',
        'grid-dense': '10px 10px',
        'gradient-animated': '400% 400%',
        'shimmer': '200% 100%',
        'radar': '100% 100%',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};

export default config;
