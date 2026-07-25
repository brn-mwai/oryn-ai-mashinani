// Stub for basehub/react-rich-text
import * as React from "react";

export interface RichTextProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const RichText = ({ children }: RichTextProps) => {
  return <>{children}</>;
};
