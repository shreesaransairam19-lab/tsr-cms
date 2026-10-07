"use client";

import * as React from "react";
import { Search, Command as CommandIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CommandInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
}

interface CommandItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  value?: string;
  onSelect?: (value: string) => void;
}

interface CommandSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandContext = React.createContext<{
  query: string;
  setQuery: (q: string) => void;
}>({ query: "", setQuery: () => {} });

function Command({ className, ...props }: CommandProps) {
  const [query, setQuery] = React.useState("");

  return (
    <CommandContext.Provider value={{ query, setQuery }}>
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
          className
        )}
        {...props}
      />
    </CommandContext.Provider>
  );
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, ...props }, ref) => {
    const { query, setQuery } = React.useContext(CommandContext);

    return (
      <div className="flex items-center border-b px-3">
        <CommandIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={ref}
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          {...props}
        />
      </div>
    );
  }
);
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CommandList.displayName = "CommandList";

function CommandEmpty({
  className,
  ...props
}: CommandEmptyProps) {
  return (
    <div
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  heading,
  children,
  ...props
}: CommandGroupProps) {
  return (
    <div className={cn("overflow-hidden p-1", className)} {...props}>
      {heading && (
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, value, onSelect, children, ...props }, ref) => {
    const { query } = React.useContext(CommandContext);

    const itemText =
      typeof children === "string" ? children : value || "";
    const isVisible =
      !query ||
      itemText.toLowerCase().includes(query.toLowerCase());

    if (!isVisible) return null;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
          className
        )}
        onClick={() => onSelect?.(value || "")}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CommandItem.displayName = "CommandItem";

function CommandSeparator({
  className,
  ...props
}: CommandSeparatorProps) {
  return (
    <div
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
};
