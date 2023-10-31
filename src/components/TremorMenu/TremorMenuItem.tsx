import { Menu } from "@headlessui/react"
import { HTMLAttributes, forwardRef } from "react"
import { twMerge } from "tailwind-merge"

export type TremorMenuItemProps = HTMLAttributes<HTMLDivElement> & {
  value: string
  icon?: React.ElementType
}

export const TremorMenuItem = forwardRef<HTMLDivElement, TremorMenuItemProps>((props, ref) => {
  const { value, icon, ...rest } = props

  const Icon = icon

  return (
    <Menu.Item
      as="div"
      ref={ref}
      className={twMerge(
        // common
        "flex justify-start items-center cursor-default text-tremor-default p-2.5 cursor-pointer",
        // light
        "ui-active:bg-tremor-background-muted ui-active:text-tremor-content-strong ui-selected:text-tremor-content-strong ui-selected:bg-tremor-background-muted text-tremor-content-emphasis",
        // dark
        "dark:ui-active:bg-dark-tremor-background-muted  dark:ui-active:text-dark-tremor-content-strong dark:ui-selected:text-dark-tremor-content-strong dark:ui-selected:bg-dark-tremor-background-muted dark:text-dark-tremor-content-emphasis"
      )}
      {...rest}
    >
      {Icon && (
        <Icon
          className={twMerge(
            // common
            "flex-none mr-1.5 w-5",
            // light
            "text-tremor-content-subtle",
            // dark
            "dark:text-dark-tremor-content-subtle"
          )}
        />
      )}
      <span className="whitespace-nowrap truncate">{value}</span>
    </Menu.Item>
  )
})
