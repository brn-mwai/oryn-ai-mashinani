// Stub for basehub/react-search
import * as React from "react";

export interface Hit {
  _id: string;
  [key: string]: unknown;
}

export const useSearch = () => ({
  query: "",
  setQuery: () => {},
  results: [],
  isLoading: false,
});

export const SearchBox = ({ children }: { children?: React.ReactNode }) => {
  return <>{children}</>;
};
