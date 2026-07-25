// Stub for basehub/react-icon
import * as React from "react";

export const Icon = ({ children, ...props }: React.ComponentProps<"span">) => {
  return <span {...props}>{children}</span>;
};
