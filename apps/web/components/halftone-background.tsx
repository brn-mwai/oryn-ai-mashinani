"use client";

import React from "react";
import Image from "next/image";

interface HalftoneBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function HalftoneBackground({ 
  className = "", 
  style = {} 
}: HalftoneBackgroundProps) {
  return (
    <div
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundColor: "#1a2b32",
        ...style,
      }}
    >
      <Image
        src="/auth-bg.png"
        alt="Background"
        fill
        priority
        quality={90}
        style={{
          objectFit: "cover",
          objectPosition: "center",
          filter: "brightness(0.7) contrast(1.2)",
        }}
      />
    </div>
  );
}

export const defaultConfig = {};
