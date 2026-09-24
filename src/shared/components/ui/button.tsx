import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/* Marmo: angoli 4px, semibold, altezze 34/42/50, tre varianti sobrie. */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-semibold tracking-[0.01em] whitespace-nowrap transition-[background-color,color,border-color,transform] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:border-secondary-foreground hover:bg-secondary-foreground",
        outline:
          "border-input bg-transparent text-foreground hover:border-muted-foreground hover:bg-muted aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-border aria-expanded:bg-secondary",
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "border-status-churn/60 bg-transparent text-status-churn hover:bg-status-churn-soft focus-visible:border-status-churn focus-visible:ring-status-churn/20",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3.5 text-[13px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-7 text-[15px] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-9",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
