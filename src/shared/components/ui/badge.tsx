import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * Marmo: pillola con tre toni di stato.
 *   active   → verde salvia (fatto, pagato, attivo)
 *   expiring → ocra (in corso, in scadenza, bozza)
 *   churn    → argilla (scaduto, fuori target, errore)
 *   neutral  → grigio (informativo)
 *   outline  → solo bordo (assente / da fare)
 * Gli alias shadcn restano validi: default=active, secondary=neutral, destructive=churn.
 */
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-[3px] text-xs font-semibold tracking-[0.01em] whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        active: "bg-status-active-soft text-status-active",
        expiring: "bg-status-expiring-soft text-status-expiring",
        churn: "bg-status-churn-soft text-status-churn",
        neutral: "bg-secondary text-muted-foreground",
        outline: "border-input bg-transparent text-muted-foreground",
        default: "bg-status-active-soft text-status-active",
        secondary: "bg-secondary text-muted-foreground",
        destructive: "bg-status-churn-soft text-status-churn",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

type BadgeProps = useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Pallino colorato prima del testo. */
    dot?: boolean
  }

function Badge({ className, variant = "neutral", dot = false, render, children, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
        children: dot ? (
          <>
            <span aria-hidden className="size-1.5 rounded-full bg-current opacity-85" />
            {children}
          </>
        ) : (
          children
        ),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
