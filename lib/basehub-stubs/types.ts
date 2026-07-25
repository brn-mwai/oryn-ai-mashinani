// Type stubs for basehub
export namespace fragmentOn {
  export type infer<T> = T extends (...args: any[]) => any ? ReturnType<T> : T;
}
