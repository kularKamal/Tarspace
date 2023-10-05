import { twMerge } from "tailwind-merge"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="status">
      <div
        className={twMerge(
          className,
          "animate-pulse bg-tremor-background-skeleton rounded-full dark:bg-dark-tremor-background-skeleton"
        )}
        {...props}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
