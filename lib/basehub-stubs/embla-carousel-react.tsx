"use client";
import * as React from "react";

export type EmblaCarouselType = {
  scrollSnapList: () => number[];
  selectedScrollSnap: () => number;
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  on: (event: string, callback: (api: EmblaCarouselType) => void) => void;
};

type UseEmblaCarouselType = [
  React.RefCallback<HTMLDivElement>,
  EmblaCarouselType | undefined
];

export default function useEmblaCarousel(
  _options?: Record<string, unknown>,
  _plugins?: unknown[]
): UseEmblaCarouselType {
  const [emblaApi] = React.useState<EmblaCarouselType | undefined>(() => ({
    scrollSnapList: () => [],
    selectedScrollSnap: () => 0,
    scrollTo: () => {},
    scrollPrev: () => {},
    scrollNext: () => {},
    on: () => {},
  }));

  const emblaRef: React.RefCallback<HTMLDivElement> = React.useCallback(() => {}, []);

  return [emblaRef, emblaApi];
}

export { type EmblaCarouselType };
