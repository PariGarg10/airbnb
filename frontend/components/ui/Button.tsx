import { clsx } from "clsx";

type ButtonVariant = "primary" | "outline" | "ghost" | "link-underline";

const variants: Record<ButtonVariant, string> = {
  primary:
    "search-fill rounded-lg px-5 py-3 text-white",
  outline: "rounded-lg border border-ink bg-white px-5 py-3 text-ink hover:bg-soft",
  ghost: "rounded-lg px-4 py-2 text-ink hover:bg-soft",
  "link-underline": "rounded-none bg-transparent p-0 underline underline-offset-4 hover:text-ink",
};

export function buttonClasses(variant: ButtonVariant = "primary", className?: string): string {
  return clsx(
    "t-button inline-flex items-center justify-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
