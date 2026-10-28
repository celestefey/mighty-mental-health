'use client';

import React from 'react';
import { Shader, MeshGradient, Strands, SimplexNoise, Vignette } from 'shaders/react';

export interface SomaticBreathworkShaderProps {
  mode?: 'light' | 'dark';
  className?: string;
  speed?: number;
}

/**
 * SomaticBreathworkShader (Concept 01 - Enhanced)
 * 
 * Clinical Purpose:
 * Calming multi-layered mesh gradient featuring DUAL-LAYER synchronous motion:
 * 1. Base Mesh: Organic undulating somatic breathing gradient (calibrated at responsive 0.55x speed).
 * 2. Second Moving Layer: Floating ethereal light ribbons/strands flowing diagonally across the mesh,
 *    providing dynamic depth without sensory overwhelm.
 * 
 * - Light Mode: Clean porcelain canvas (#F8FAFC) with gentle blue mist and warm golden sun streams.
 * - Dark Mode: Luminous Bold Navy (#130C76) and Philippine Blue (#0038A8) with radiant Cadmium Orange (#F96100) streams.
 * 
 * Zero cursor follow: 100% serene ambient animation.
 */
export function SomaticBreathworkShader({
  mode = 'light',
  className = "absolute inset-0 -z-10 w-full h-full",
  speed = 0.55
}: SomaticBreathworkShaderProps) {
  const isDark = mode === 'dark';

  return (
    <Shader className={className}>
      {/* Layer 1: Primary Undulating Somatic Mesh */}
      <MeshGradient
        colorA={isDark ? "#130C76" : "#F8FAFC"} // Bold Navy vs Crisp Porcelain
        colorB={isDark ? "#0038A8" : "#E0F2FE"} // Philippine Blue vs Soft Sky Blue
        colorC={isDark ? "#F96100" : "#FFF3E6"} // Cadmium Orange vs Warm Peach
        colorD={isDark ? "#0E0A48" : "#FFFFFF"} // Radiant Deep Navy vs Pure White
        colorSpace="oklab"
        speed={speed}
        distortion={0.65}
      />

      {/* Layer 2: Second Moving Element — Luminous Ethereal Strands */}
      <Strands
        count={6}
        colorA={isDark ? "#FFAC24" : "#F96100"}
        colorB={isDark ? "#0038A8" : "#93C5FD"}
        speed={speed * 1.25}
        thickness={0.25}
        frequency={1.8}
        amplitude={0.35}
        opacity={isDark ? 0.45 : 0.22}
        blendMode={isDark ? "screen" : "multiply"}
      />

      {/* Fine tactile grain */}
      <SimplexNoise
        scale={3.2}
        speed={0.15}
        opacity={isDark ? 0.04 : 0.02}
        blendMode="softLight"
      />

      {/* Gentle focus vignette */}
      <Vignette
        radius={0.78}
        intensity={isDark ? 0.42 : 0.16}
      />
    </Shader>
  );
}

export default SomaticBreathworkShader;
