import * as React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language/language-provider";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, suffix, ...props }, ref) => {
    const { isRTL } = useLanguage();
    
    return (
      <div className="relative">
        {prefix && (
          <div className={`absolute inset-y-0 ${isRTL ? 'right-0' : 'left-0'} flex items-center ${isRTL ? 'pr-3' : 'pl-3'}`}>
            <span className="text-sm text-muted-foreground">{prefix}</span>
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            prefix && (isRTL ? "pr-8" : "pl-8"),
            suffix && "pr-8",
            isRTL && "text-right",
            className
          )}
          dir={isRTL ? "rtl" : "ltr"}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none`}>
            <span className="text-sm text-muted-foreground">{suffix}</span>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
