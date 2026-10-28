'use client';

import React from 'react';
import { Shader, IsometricCubes, LightEdge, LinearGradient } from 'shaders/react';

export interface AdaptiveStrengthShaderProps {
  mode?: 'light' | 'dark';
  className?: string;
  cubeSize?: number;
  speed?: number;
}

/**
 * AdaptiveStrengthShader (Concept 02)
 * 
 * Clinical & Brand Purpose:
 * Direct WebGPU translation of the "3D Isometric Stepped Grid" (pattern-cubes.svg)
 * from Section 4.7 of the MMH Brand Guidelines.
 * 
 * - Light Mode: Clean architectural slate blocks (#F8FAFC / #E2E8F0) with delicate wireframe edges.
 * - Dark Mode: Luminous Bold Navy (#130C76) and Philippine Blue (#0038A8) cubes with radiant amber highlights.
 * 
 * Purely ambient background: No cursor tracking.
 */
export function AdaptiveStrengthShader({
  mode = 'light',
  className = "absolute inset-0 -z-10 w-full h-full",
  cubeSize = 54,
  speed = 0.22
}: AdaptiveStrengthShaderProps) {
  const isDark = mode === 'dark';

  return (
    <Shader className={className}>
      {/* Foundation Backdrop */}
      <LinearGradient
        colorA={isDark ? "#0E0942" : "#FFFFFF"}
        colorB={isDark ? "#130C76" : "#F1F5F9"}
        angle={135}
        colorSpace="oklab"
      />

      {/* 3D Isometric Tumbling-Blocks Rhombille Tiling */}
      <IsometricCubes
        size={cubeSize}
        colorTop={isDark ? "#0038A8" : "#F8FAFC"}
        colorLeft={isDark ? "#130C76" : "#E2E8F0"}
        colorRight={isDark ? "#0B064A" : "#CBD5E1"}
        bevel={0.08}
        opacity={isDark ? 0.88 : 0.65}
        speed={speed}
      />

      {/* Radiant Amber Light Edges illustrating progressive adaptation */}
      <LightEdge
        color="#F96100"
        speed={0.35}
        intensity={isDark ? 0.45 : 0.30}
        blendMode="screen"
      />
    </Shader>
  );
}

export default AdaptiveStrengthShader;
