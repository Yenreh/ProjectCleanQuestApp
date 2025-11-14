import * as React from "react";
import { cn } from "./utils";
import { Input } from "./input";

interface InputWithIconProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
}

function InputWithIcon({ icon, className, ...props }: InputWithIconProps) {
  if (!icon) {
    return <Input className={className} {...props} />;
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10 pointer-events-none">
        {icon}
      </div>
      <Input className={cn("pl-10", className)} {...props} />
    </div>
  );
}

export { InputWithIcon };
