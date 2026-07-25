// Stub for basehub/react-code-block
import * as React from "react";

export type Language = string;

export const CodeBlock = ({ children }: { children?: React.ReactNode }) => {
  return <pre>{children}</pre>;
};

export const createCssVariablesTheme = () => ({});
