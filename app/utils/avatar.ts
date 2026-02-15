export const AVATAR_STYLES = [
  'bottts',
  'fun-emoji',
  'adventurer',
  'pixel-art',
  'thumbs',
  'shapes',
] as const

export type AvatarStyle = (typeof AVATAR_STYLES)[number]

export const DEFAULT_AVATAR_STYLE: AvatarStyle = 'bottts'

export function getAvatarUrl(
  name: string,
  seed?: string | null,
  style?: string | null,
  size: number = 64,
): string {
  const s = style || DEFAULT_AVATAR_STYLE
  const sd = seed || name
  return `https://api.dicebear.com/9.x/${s}/svg?seed=${encodeURIComponent(sd)}&size=${size}`
}

export function generateRandomSeed(): string {
  return Math.random().toString(36).slice(2, 10)
}
