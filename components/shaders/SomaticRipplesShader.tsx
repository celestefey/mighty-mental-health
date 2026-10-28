'use client';

import React from 'react';
import { Shader, Ripples, SineWave, LinearGradient, Vignette } from 'shaders/react';

export interface SomaticRipplesShaderProps {
  mode?: 'light' | 'dark';
  className?: string;
  speed?: number;
}

/**
 * SomaticRipplesShader (Concept 02 - Re-imagined from Seigaiha Brand Motif)
 * 
 * Clinical & Brand Purpose:
 * Replaces the rigid/brutalist 3D cubes with organic, calming concentric ripples
 * and breathing wave fans directly derived from the Seigaiha Tidal motif (Section 4.7).
 * Embodies emotional regulation, nervous system de-escalation, and tranquil rhythm.
 * 
 * - Light Mode: Clean porcelain backdrop (#F8FAFC) with soft cerulean and warm amber ripple arcs.
 * - Dark Mode: Deep oceanic Bold Navy (#130C76) with luminous blue and cadmium orange crests.
 * 
 * Zero cursor follow: 100% serene autonomous respiration.
 */
export function SomaticRipplesShader({
  mode = 'light',
  className = "absolute inset-0 -z-10 w-full h-full",
  speed = 0.35
}: SomaticRipplesShaderProps) {
  const isDark = mode === 'dark';

  return (
    <Shader className={className}>
      {/* Foundation Base Gradient */}
      <LinearGradient
        colorA={isDark ? "#0E0946" : "#FFFFFF"}
        colorB={isDark ? "#130C76" : "#F1F5F9"}
        angle={120}
        colorSpace="oklab"
      />

      {/* Primary Breath Cadence Sine Wave */}
      <SineWave
        color={isDark ? "#0038A8" : "#93C5FD"}
        amplitude={0.2}
        frequency={1.5}
        speed={speed}
        thickness={0.35}
        softness={0.7}
        opacity={isDark ? 0.65 : 0.3}
      />

      {/* Gentle Concentric Ripples (Seigaiha Respiration) */}
      <Ripples
        center={{ x: 0.5, y: 0.55 }}
        frequency={6.0}
        speed={speed * 0.8}
        amplitude={0.18}
        decay={0.4}
        color={isDark ? "#F96100" : "#F96100"}
        opacity={isDark ? 0.35 : 0.18}
        blendMode={isDark ? "screen" : "multiply"}
      />

      {/* Atmospheric Soft Vignette */}
      <Vignette
        radius={0.8}
        intensity={isDark ? 0.45 : 0.15}
      />
    </Shader>
  );
}

export default SomaticRipplesShader;
