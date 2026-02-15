export interface DartboardThemeColors {
  black: string
  white: string
  red: string
  green: string
  wireColor: string
  numberColor: string
  background: string
  bullOuter: string
  bullInner: string
}

export interface DartboardTheme {
  id: string
  name: string
  colors: DartboardThemeColors
}

export const DARTBOARD_THEMES: DartboardTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    colors: {
      black: '#1A1A1A',
      white: '#F5E6C8',
      red: '#E8113A',
      green: '#009B48',
      wireColor: '#C0C0C0',
      numberColor: '#FFFFFF',
      background: '#2D2D2D',
      bullOuter: '#009B48',
      bullInner: '#E8113A',
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: {
      black: '#0D0D1A',
      white: '#1A1A2E',
      red: '#FF1493',
      green: '#00FF88',
      wireColor: '#8844FF',
      numberColor: '#E0E0FF',
      background: '#06060F',
      bullOuter: '#00FF88',
      bullInner: '#FF1493',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: {
      black: '#1A1A1A',
      white: '#D0D0D0',
      red: '#707070',
      green: '#505050',
      wireColor: '#888888',
      numberColor: '#E0E0E0',
      background: '#2A2A2A',
      bullOuter: '#505050',
      bullInner: '#707070',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      black: '#000000',
      white: '#FFFFFF',
      red: '#FF0000',
      green: '#00CC00',
      wireColor: '#FFFF00',
      numberColor: '#FFFF00',
      background: '#000000',
      bullOuter: '#00CC00',
      bullInner: '#FF0000',
    },
  },
]

export const DEFAULT_THEME_ID = 'classic'

export function getThemeById(id: string): DartboardTheme {
  return DARTBOARD_THEMES.find(t => t.id === id) ?? DARTBOARD_THEMES[0]
}
