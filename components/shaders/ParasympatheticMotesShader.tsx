'use client';

import React from 'react';
import { Shader, FloatingParticles, SineWave, Vignette, SolidColor } from 'shaders/react';

export interface ParasympatheticMotesShaderProps {
  mode?: 'light' | 'dark';
  lightThemeVariant?: 'coastal-blue' | 'warm-linen';
  className?: string;
  particleCount?: number;
  speed?: number;
}

/**
 * ParasympatheticMotesShader (Concept 04 - The Approved Hero Champion)
 * 
 * Clinical & Brand Purpose:
 * Ranked by client as the standout favorite. Features thousands of gentle, autonomous
 * golden and warm amber motes drifting peacefully across rhythmic tidal breathing waves.
 * Zero cursor follow for maximum clinical tranquility.
 * 
 * Background Color Specifications (Non-White Light Mode):
 * - Light Mode (Coastal Blue): Rich, soothing atmospheric slate-blue (#DCE5F2) with deeper
 *   oceanic wave undertones (#B8CEE8) and rich amber/terracotta drifting motes (#C2410C, #B45309).
 * - Light Mode (Warm Linen): Warm, organic therapeutic earth-sand (#F2EBE1) with warm terracotta motes.
 * - Dark Mode: Luminous Bold Navy (#130C76) ocean with sparkling Aureoline Yellow (#FFAC24)
 *   and Cadmium Orange (#F96100) embers.
 */
export function ParasympatheticMotesShader({
  mode = 'light',
  lightThemeVariant = 'coastal-blue',
  className = "absolute inset-0 -z-10 w-full h-full",
  particleCount = 1800,
  speed = 0.32
}: ParasympatheticMotesShaderProps) {
  const isDark = mode === 'dark';
  const isCoastal = lightThemeVariant === 'coastal-blue';

  // Rich, non-white base color for Light Mode
  const lightBgColor = isCoastal ? "#DCE5F2" : "#F2EBE1";
  const lightWaveColor = isCoastal ? "#93C5FD" : "#E2D9CD";
  const lightParticleA = isCoastal ? "#C2410C" : "#9A3412"; // Deep Amber / Terracotta
  const lightParticleB = isCoastal ? "#D97706" : "#B45309"; // Warm Ochre

  return (
    <Shader className={className}>
      {/* Base Non-White Foundation */}
      <SolidColor color={isDark ? "#0E0946" : lightBgColor} />

      {/* Deep Rhythmic Tidal Sine Waves (Breath Cadence) */}
      <SineWave
        color={isDark ? "#0038A8" : lightWaveColor}
        amplitude={0.18}
        frequency={1.3}
        speed={speed * 0.8}
        thickness={0.42}
        softness={0.7}
        opacity={isDark ? 0.65 : 0.45}
      />

      {/* Thousands of Autonomous Drifting Restorative Motes */}
      <FloatingParticles
        count={particleCount}
        colorA={isDark ? "#FFAC24" : lightParticleA}
        colorB={isDark ? "#F96100" : lightParticleB}
        sizeMin={1.4}
        sizeMax={3.8}
        speed={speed}
        wander={0.42}
        blendMode={isDark ? "screen" : "multiply"}
        opacity={isDark ? 0.85 : 0.65}
      />

      {/* Atmospheric Soft Vignette */}
      <Vignette
        radius={0.76}
        intensity={isDark ? 0.48 : 0.25}
      />
    </Shader>
  );
}

export default ParasympatheticMotesShader;
