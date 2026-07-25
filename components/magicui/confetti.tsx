"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

interface ConfettiOptions {
  particleCount?: number;
  angle?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  ticks?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  shapes?: ("square" | "circle")[];
  scalar?: number;
  zIndex?: number;
  disableForReducedMotion?: boolean;
}

export interface ConfettiRef {
  fire: (options?: ConfettiOptions) => void;
}

interface ConfettiProps {
  className?: string;
  options?: ConfettiOptions;
  globalOptions?: ConfettiOptions;
  manualstart?: boolean;
  children?: React.ReactNode;
}

const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  (
    {
      className,
      options = {},
      globalOptions = {},
      manualstart = false,
      children,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const confettiRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      fire: (opts?: ConfettiOptions) => {
        if (confettiRef.current) {
          confettiRef.current({ ...globalOptions, ...options, ...opts });
        }
      },
    }));

    useEffect(() => {
      const loadConfetti = async () => {
        if (typeof window !== "undefined") {
          const confettiModule = await import("canvas-confetti");
          if (canvasRef.current) {
            confettiRef.current = confettiModule.create(canvasRef.current, {
              resize: true,
              useWorker: true,
            });

            if (!manualstart) {
              confettiRef.current({ ...globalOptions, ...options });
            }
          }
        }
      };

      loadConfetti();

      return () => {
        if (confettiRef.current) {
          confettiRef.current.reset();
        }
      };
    }, [manualstart, globalOptions, options]);

    return (
      <>
        <canvas
          ref={canvasRef}
          className={cn(
            "pointer-events-none absolute left-0 top-0 z-50 size-full",
            className
          )}
        />
        {children}
      </>
    );
  }
);

Confetti.displayName = "Confetti";

export { Confetti };

// Utility function for basic confetti burst
export function fireConfetti(options?: ConfettiOptions) {
  if (typeof window !== "undefined") {
    import("canvas-confetti").then((confetti) => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        ...options,
      });
    });
  }
}
