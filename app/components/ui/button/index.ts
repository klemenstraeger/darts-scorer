export { default as Button } from './Button.vue'

export type ButtonVariant = 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'accent'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

export interface ButtonVariants {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-[var(--yellow)] border-2 border-black shadow-md font-bold',
  primary: 'bg-[var(--yellow)] border-2 border-black shadow-md font-bold',
  destructive: 'bg-[var(--red-light)] text-[var(--red)] border-2 border-black shadow-md font-bold',
  outline: 'bg-[var(--surface-1)] border-2 border-black shadow-md font-bold',
  secondary: 'bg-[var(--surface-2)] border-2 border-black shadow-md font-bold',
  ghost: 'bg-transparent border-2 border-dashed border-black shadow-none font-bold',
  link: 'bg-transparent border-0 shadow-none underline-offset-4 hover:underline font-bold',
  accent: 'bg-[var(--lime)] border-2 border-black shadow-md font-bold',
}

const sizeClasses: Record<ButtonSize, string> = {
  'default': 'h-9 px-4 py-2 text-sm rounded-lg',
  'sm': 'h-8 px-3 text-xs rounded-md gap-1.5',
  'lg': 'h-10 px-6 text-sm rounded-lg',
  'icon': 'size-9 rounded-lg',
  'icon-sm': 'size-8 rounded-md',
  'icon-lg': 'size-10 rounded-lg',
}

const interactiveBase = 'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'

export function buttonVariants(options?: { variant?: ButtonVariant, size?: ButtonSize }): string {
  const variant = options?.variant ?? 'default'
  const size = options?.size ?? 'default'
  return `${interactiveBase} ${variantClasses[variant]} ${sizeClasses[size]}`
}
