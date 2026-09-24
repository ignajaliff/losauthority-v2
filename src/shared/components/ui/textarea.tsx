import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full resize-y rounded-sm border border-input bg-card px-3 py-2.5 text-base leading-relaxed text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
