import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'app-btn shrink-0 whitespace-nowrap focus-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'app-btn-primary',
        secondary: 'app-btn-secondary',
        outline: 'app-btn-secondary',
        ghost: 'app-btn-ghost',
        sky: 'app-btn-sky',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'app-btn-size-default',
        sm: 'app-btn-size-sm',
        xs: 'app-btn-size-xs',
        lg: 'min-h-10 px-5 text-sm',
        icon: 'app-btn-size-icon',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
