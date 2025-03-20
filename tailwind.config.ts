
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
				// Custom color palette
				rust: {
					DEFAULT: '#cd4631', // main accent
					50: '#fdf0ed',
					100: '#f9d6cd',
					200: '#f4b8aa',
					300: '#ea8c79',
					400: '#de6950',
					500: '#cd4631',
					600: '#b73121',
					700: '#95281b',
					800: '#732018',
					900: '#541a15'
				},
				brown: {
					DEFAULT: '#9e6240',
					50: '#f8f1ec',
					100: '#eddccf',
					200: '#ddc0a9',
					300: '#c99c7c',
					400: '#b07f58',
					500: '#9e6240',
					600: '#8a4f2d',
					700: '#6f3e24',
					800: '#5a321f',
					900: '#48291b'
				},
				tan: {
					DEFAULT: '#dea47e',
					50: '#fcf7f3',
					100: '#f6e9e0',
					200: '#f0d5c3',
					300: '#e7bd9f',
					400: '#dea47e',
					500: '#d58656',
					600: '#c06939',
					700: '#a15330',
					800: '#83432a',
					900: '#6b3826'
				},
				cream: {
					DEFAULT: '#f8f2dc',
					50: '#fefefc',
					100: '#fcfbf5',
					200: '#f8f2dc',
					300: '#f0e3b6',
					400: '#e6cf87',
					500: '#dbbb61',
					600: '#c9a23f',
					700: '#a8832e',
					800: '#86682c',
					900: '#6d5528'
				},
				sky: {
					DEFAULT: '#81adc8',
					50: '#f5f8fb',
					100: '#e8eff5',
					200: '#cddfe9',
					300: '#a9c8db',
					400: '#81adc8',
					500: '#5d8fb1',
					600: '#477195',
					700: '#3b5a7a',
					800: '#344b65',
					900: '#2e4055'
				}
			},
			fontFamily: {
				sans: [
					'Inter var',
					'SF Pro Display',
					'SF Pro Text',
					'-apple-system',
					'BlinkMacSystemFont',
					'system-ui',
					'sans-serif'
				]
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'fade-out': {
					from: { opacity: '1' },
					to: { opacity: '0' }
				},
				'slide-in-up': {
					from: { transform: 'translateY(20px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-in-down': {
					from: { transform: 'translateY(-20px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'scale-in': {
					from: { transform: 'scale(0.95)', opacity: '0' },
					to: { transform: 'scale(1)', opacity: '1' }
				},
				'blur-in': {
					from: { filter: 'blur(8px)', opacity: '0' },
					to: { filter: 'blur(0)', opacity: '1' }
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'pulse-gentle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'fade-out': 'fade-out 0.4s ease-out',
				'slide-in-up': 'slide-in-up 0.5s ease-out',
				'slide-in-down': 'slide-in-down 0.5s ease-out',
				'scale-in': 'scale-in 0.4s ease-out',
				'blur-in': 'blur-in 0.4s ease-out',
				'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
				'pulse-gentle': 'pulse-gentle 3s ease-in-out infinite'
			},
			boxShadow: {
				'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
				'glass-hover': '0 8px 32px rgba(0, 0, 0, 0.15)',
				'neu': '8px 8px 16px #e9e9e9, -8px -8px 16px #ffffff',
				'neu-inset': 'inset 8px 8px 16px #e9e9e9, inset -8px -8px 16px #ffffff',
				'card': '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
