'use client';

import React from 'react';
import { Shader, Truchet, LinearGradient, Glow } from 'shaders/react';

export type GeometricShape = 'circles' | 'diamonds' | 'circuits' | 'waves';
export type GeometricTiling = 'mirrored' | 'serpentine' | 'uniform' | 'alternating-cols';
export type GeometricMotion = 'breath-pulse' | 'mandala-rotate' | 'traveling-surge';
export type GeometricColorPattern = 'diagonal' | 'checkerboard' | 'horizontal';

export interface GeometricMatrixShaderProps {
  mode?: 'light' | 'dark';
  shape?: GeometricShape;
  tiling?: GeometricTiling;
  motion?: GeometricMotion;
  colorPattern?: GeometricColorPattern;
  className?: string;
  scale?: number;
  speed?: number;
}

/**
 * GeometricMatrixShader (Concept 05 — Structured & Intentional Geometry)
 * 
 * Clinical & Brand Metaphor:
 * Replaces organic/random curves with structured, intentional geometric shapes.
 * Symbolizes cognitive clarity, structured evidence-based therapy, boundary setting,
 * and emotional balance.
 * 
 * Available Configurations:
 * - shape: 'circles' (interlocking circular mandalas) | 'diamonds' (isometric facets) |
 *          'circuits' (orthogonal 90° pathways) | 'waves' (mathematical sine channels)
 * - tiling: 'mirrored' (symmetrical mandalas) | 'serpentine' (flowing waves) | 'uniform' (parallel tracks)
 * - motion: 'breath-pulse' (respiration weight) | 'mandala-rotate' (90° morph) | 'traveling-surge' (electrical wave)
 * - colorPattern: 'diagonal' | 'checkerboard' | 'horizontal'
 */
export function GeometricMatrixShader({
  mode = 'light',
  shape = 'circles',
  tiling = 'uniform',
  motion = 'mandala-rotate',
  colorPattern = 'checkerboard',
  className = "absolute inset-0 -z-10 w-full h-full",
  scale = 64,
  speed = 0.22
}: GeometricMatrixShaderProps) {
  const isDark = mode === 'dark';

  return (
    <Shader className={className}>
      {/* Non-White Atmospheric Foundation (#DCE5F2 Coastal Blue vs Deep Navy) */}
      <LinearGradient
        colorA={isDark ? "#0E0946" : "#E2EAF4"}
        colorB={isDark ? "#130C76" : "#CBD9E8"}
        angle={90}
        colorSpace="oklab"
      />

      {/* Symmetrical Geometric Matrix Architecture */}
      <Truchet
        scale={scale}
        shapeType={shape}
        tilingMode={tiling}
        lineWidth={isDark ? 3.0 : 2.4}
        strokeColor={isDark ? "#0038A8" : "#130C76"}
        accentColor={isDark ? "#FFAC24" : "#F96100"}
        colorPattern={colorPattern}
        animationMode={motion}
        speed={speed}
        opacity={isDark ? 0.85 : 0.65}
      />

      {/* Ambient Radiant Warmth Glow */}
      <Glow
        color={isDark ? "#FFAC24" : "#F96100"}
        radius={0.5}
        intensity={isDark ? 0.40 : 0.22}
        blendMode="screen"
      />
    </Shader>
  );
}

export default GeometricMatrixShader;
