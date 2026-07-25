// Stub for basehub/events - no-op implementations for when basehub isn't configured
export const sendEvent = async (..._args: unknown[]) => {};
export const parseFormData = (formData: FormData) => {
  const data: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  return data;
};
