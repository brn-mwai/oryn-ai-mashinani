// Comprehensive stub for basehub main module
// Used when basehub SDK is not configured

export const basehub = () => ({
  query: async () => ({
    site: {
      pages: { items: [] },
      settings: {
        metadata: {},
        theme: { accent: "violet", grayScale: "slate" },
        logo: {
          dark: { url: "/logo-light.svg", alt: "Oryn", width: 410, height: 133, aspectRatio: "410/133", blurDataURL: null },
          light: { url: "/logo-dark.svg", alt: "Oryn", width: 410, height: 133, aspectRatio: "410/133", blurDataURL: null },
        },
        logoLite: { url: "/logo-dark.svg", alt: "Oryn", width: 410, height: 133 },
        showUseTemplate: false,
      },
      generalEvents: { ingestKey: "" },
      header: {
        navbar: { items: [] },
        rightCtas: { items: [] },
      },
      footer: {
        navbar: { items: [] },
        copyright: "2025 Oryn. All rights reserved.",
        socialLinks: [],
        newsletter: null,
      },
      blog: { posts: { items: [] } },
      changelog: { posts: { items: [] } },
    },
    _sys: {
      playgroundInfo: null,
    },
  }),
});

export const fragmentOn = (_type: string, _fragment: unknown) => _fragment as any;

export const setGlobalConfig = (_config: unknown) => {};

// Type exports
export type { fragmentOn } from "./types";
