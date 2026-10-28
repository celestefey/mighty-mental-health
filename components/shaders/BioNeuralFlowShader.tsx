'use client';

import React from 'react';
import { Shader, Truchet, RadialGradient, Glow, LinearGradient, FluidLines } from 'shaders/react';

export type BioNeuralVariant = 
  | 'gradient-sweep'   // 3A: Stable pathways with continuous traveling gradient surge
  | 'morph'            // 3B: Connections smoothly rotate and rewire in clusters
  | 'synaptic-drift'   // 3C: Organic undulating living fibers/dendrites
  | 'hybrid'           // 3D: Neuroplastic morph + traveling surge combined
  | 'breath-pulse';    // 3E: Diaphragmatic breath cycle

export interface BioNeuralFlowShaderProps {
  mode?: 'light' | 'dark';
  variant?: BioNeuralVariant;
  driftSync?: 'unified' | 'harmonic';
  colorPattern?: 'diagonal' | 'checkerboard' | 'horizontal';
  className?: string;
  scale?: number;
  speed?: number;
}

/**
 * BioNeuralFlowShader (Concept 03 Suite — Dynamic Shifting & Gradient Variations)
 * 
 * Clinical Metaphor:
 * Symbolizes neuroplasticity, somatic awareness, and autonomic regulation.
 * 
 * Available Variations:
 * 1. 'gradient-sweep' (03A): Anchored geometry with a continuous luminous diagonal
 *    gradient sweep (Philippine Blue -> Cadmium Orange -> Aureoline Yellow).
 * 2. 'morph' (03B): True neuroplasticity — synaptic arc clusters physically rotate
 *    and rewire into new pathways in a slow, grounding 6s cycle.
 * 3. 'synaptic-drift' (03C): Living, undulating biological fibers and axons.
 *    - driftSync: 'unified' (lockstep breathing rhythm) | 'harmonic' (directional wave swell)
 *    - colorPattern: 'diagonal' (45° ribbons) | 'checkerboard' (bipartite lattice) | 'horizontal' (wave strata)
 * 4. 'hybrid' (03D): The complete integration — pathways rewire as an electrical
 *    surge ripples across them.
 * 5. 'breath-pulse': Radial diaphragmatic respiration pulse.
 */
export function BioNeuralFlowShader({
  mode = 'light',
  variant = 'morph',
  driftSync = 'unified',
  colorPattern = 'diagonal',
  className = "absolute inset-0 -z-10 w-full h-full",
  scale = 48,
  speed = 0.22
}: BioNeuralFlowShaderProps) {
  const isDark = mode === 'dark';

  return (
    <Shader className={className}>
      {/* Foundation Depth Gradient (Rich Non-White Coastal Blue vs Deep Navy) */}
      <LinearGradient
        colorA={isDark ? "#0E0946" : "#E2EAF4"}
        colorB={isDark ? "#130C76" : "#CBD9E8"}
        angle={90}
        colorSpace="oklab"
      />

      {/* 3A: Gradient Wave Sweep */}
      {variant === 'gradient-sweep' && (
        <>
          <Truchet
            scale={scale}
            lineWidth={isDark ? 3.0 : 2.4}
            strokeColor={isDark ? "#0038A8" : "#130C76"}
            surgeColor={isDark ? "#FFAC24" : "#F96100"}
            waveSpeed={speed * 0.9}
            waveAngle={45}
            opacity={isDark ? 0.85 : 0.60}
          />
          <Glow color="#FFAC24" radius={0.5} intensity={isDark ? 0.40 : 0.22} blendMode="screen" />
        </>
      )}

      {/* 3B: Neuroplastic Morph (Client Favorite Request) */}
      {variant === 'morph' && (
        <>
          <Truchet
            scale={scale}
            lineWidth={isDark ? 3.0 : 2.4}
            strokeColor={isDark ? "#0038A8" : "#130C76"}
            activeColor={isDark ? "#FFAC24" : "#F96100"}
            morphMode="cluster-rotate"
            morphSpeed={speed}
            opacity={isDark ? 0.85 : 0.60}
          />
          <Glow color="#FFAC24" radius={0.35} intensity={isDark ? 0.35 : 0.20} blendMode="screen" />
        </>
      )}

      {/* 3C: Synchronized Living Synaptic Drift */}
      {variant === 'synaptic-drift' && (
        <>
          <FluidLines
            density={scale / 2}
            amplitude={driftSync === 'unified' ? 14 : 12}
            syncMode={driftSync}
            colorPattern={colorPattern}
            speed={speed * 0.9}
            colorA={isDark ? "#FFAC24" : "#F96100"}
            colorB={isDark ? "#0038A8" : "#130C76"}
            opacity={isDark ? 0.80 : 0.55}
          />
          <Glow color="#FFAC24" radius={0.4} intensity={isDark ? 0.35 : 0.20} blendMode="screen" />
        </>
      )}

      {/* 3D: Combined Hybrid Flow */}
      {variant === 'hybrid' && (
        <>
          <Truchet
            scale={scale}
            lineWidth={isDark ? 3.2 : 2.5}
            strokeColor={isDark ? "#0038A8" : "#130C76"}
            surgeColor={isDark ? "#FFAC24" : "#F96100"}
            morphMode="cluster-rotate"
            morphSpeed={speed * 0.9}
            waveSpeed={speed * 0.75}
            opacity={isDark ? 0.85 : 0.65}
          />
          <Glow color="#FFAC24" radius={0.5} intensity={isDark ? 0.45 : 0.25} blendMode="screen" />
        </>
      )}

      {/* 3E: Diaphragmatic Breath Pulse (Fallback / Classic) */}
      {variant === 'breath-pulse' && (
        <>
          <Truchet
            scale={scale}
            lineWidth={isDark ? 3.2 : 2.6}
            strokeColor={isDark ? "#0038A8" : "#130C76"}
            fillColor={isDark ? "#0D084F" : "#D4E2F0"}
            speed={0}
            morphSpeed={0}
            opacity={isDark ? 0.85 : 0.55}
          />
          <RadialGradient
            center={{ x: 0.5, y: 0.5 }}
            colorA={isDark ? "#FFAC24" : "#F96100"}
            colorB={isDark ? "#130C76" : "#CBD9E8"}
            radius={{
              type: 'auto-animate',
              mode: 'ping-pong',
              outputMin: 0.15,
              outputMax: 0.75,
              speed: speed
            }}
            opacity={isDark ? 0.4 : 0.28}
            blendMode={isDark ? "screen" : "multiply"}
          />
          <Glow color="#FFAC24" radius={0.4} intensity={isDark ? 0.45 : 0.25} blendMode="linearDodge" />
        </>
      )}
    </Shader>
  );
}

export default BioNeuralFlowShader;
