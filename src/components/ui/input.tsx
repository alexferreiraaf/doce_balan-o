import * as React from "react"
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils"
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"


const InputWithCopy = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    const { toast } = useToast();

    const handleCopy = () => {
      if (props.value) {
        navigator.clipboard.writeText(String(props.value));
        toast({ title: "Copiado!", description: "A chave PIX foi copiada para a área de transferência." });
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          className={cn("pr-10", className)}
          readOnly
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);
InputWithCopy.displayName = "InputWithCopy";

export * from './masked-input';
export { Input, InputWithCopy }