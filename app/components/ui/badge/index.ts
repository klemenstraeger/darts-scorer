export { default as Badge } from './Badge.vue'

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--yellow)] text-black border-black',
  secondary: 'bg-[var(--surface-2)] text-black border-black',
  destructive: 'bg-[var(--red-light)] text-[var(--red)] border-black',
  outline: 'bg-transparent text-black border-black',
  success: 'bg-[var(--green-light)] text-[var(--green)] border-black',
  warning: 'bg-[var(--orange-light)] text-[var(--orange)] border-black',
}

export function badgeVariants(options?: { variant?: BadgeVariant }): string {
  const variant = options?.variant ?? 'default'
  return `inline-flex items-center gap-1 rounded-md border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wide transition-colors ${variantClasses[variant]}`
}
