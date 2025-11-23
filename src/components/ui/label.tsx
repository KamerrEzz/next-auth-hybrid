import * as React from "react";
import { cn } from "@/lib/utils";

const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium", className)} {...props} />
);

export { Label };