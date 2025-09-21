/**
 * Lightning Generation Algorithm
 * Creates realistic lightning bolts using midpoint displacement and fractal branching
 */

export interface Point {
  x: number;
  y: number;
}

export interface LightningSegment {
  start: Point;
  end: Point;
  width: number;
  intensity: number;
  isBranch: boolean;
}

export interface LightningConfig {
  // Main bolt properties
  startPoint: Point;
  endPoint: Point;
  maxSegmentLength: number;
  minSegmentLength: number;
  
  // Chaos and displacement
  chaosFactor: number; // Angle variation in radians
  displacementFactor: number; // Perpendicular displacement strength
  
  // Branching
  branchProbability: number; // 0-1
  maxBranchDepth: number;
  branchAngleVariation: number; // Radians
  branchLengthDecay: number; // 0-1
  branchIntensityDecay: number; // 0-1
  
  // Visual properties
  baseWidth: number;
  widthDecay: number;
  glowIntensity: number;
  
  // Performance
  maxSegments: number;
}

export const defaultLightningConfig: LightningConfig = {
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 100, y: 100 },
  maxSegmentLength: 50,
  minSegmentLength: 10,
  chaosFactor: Math.PI / 6, // 30 degrees
  displacementFactor: 0.3,
  branchProbability: 0.3,
  maxBranchDepth: 4,
  branchAngleVariation: Math.PI / 8, // 22.5 degrees
  branchLengthDecay: 0.7,
  branchIntensityDecay: 0.6,
  baseWidth: 3,
  widthDecay: 0.9,
  glowIntensity: 2,
  maxSegments: 200
};

/**
 * Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle between two points
 */
function angle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Generate a point at given distance and angle from origin
 */
function pointFromPolar(origin: Point, distance: number, angle: number): Point {
  return {
    x: origin.x + distance * Math.cos(angle),
    y: origin.y + distance * Math.sin(angle)
  };
}

/**
 * Midpoint displacement for segment
 */
function displaceSegment(start: Point, end: Point, factor: number): Point {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Calculate perpendicular angle
  const segmentAngle = angle(start, end);
  const perpAngle = segmentAngle + Math.PI / 2;
  
  // Random displacement
  const displacement = (Math.random() - 0.5) * distance(start, end) * factor;
  
  return {
    x: midX + displacement * Math.cos(perpAngle),
    y: midY + displacement * Math.sin(perpAngle)
  };
}

/**
 * Generate lightning bolt with recursive branching
 */
export function generateLightning(config: LightningConfig): LightningSegment[] {
  const segments: LightningSegment[] = [];
  let segmentCount = 0;
  
  function addSegment(segment: LightningSegment) {
    if (segmentCount >= config.maxSegments) return false;
    segments.push(segment);
    segmentCount++;
    return true;
  }
  
  function generateBolt(
    start: Point,
    end: Point,
    depth: number,
    width: number,
    intensity: number,
    isBranch: boolean = false
  ): void {
    if (depth >= config.maxBranchDepth || segmentCount >= config.maxSegments) {
      return;
    }
    
    const dist = distance(start, end);
    
    // If segment is too short, draw it directly
    if (dist <= config.minSegmentLength) {
      addSegment({ start, end, width, intensity, isBranch });
      return;
    }
    
    // If segment is long enough, subdivide with displacement
    if (dist > config.maxSegmentLength) {
      const midpoint = displaceSegment(start, end, config.displacementFactor);
      
      // Recursively generate subsegments
      generateBolt(start, midpoint, depth, width, intensity, isBranch);
      generateBolt(midpoint, end, depth, width, intensity, isBranch);
      
      // Chance to create branch at midpoint
      if (!isBranch && Math.random() < config.branchProbability) {
        const branchAngle = angle(start, midpoint) + 
          (Math.random() - 0.5) * 2 * config.branchAngleVariation;
        
        const branchLength = dist * config.branchLengthDecay * 
          (0.5 + Math.random() * 0.5); // Some randomness in length
        
        const branchEnd = pointFromPolar(midpoint, branchLength, branchAngle);
        
        generateBolt(
          midpoint,
          branchEnd,
          depth + 1,
          width * config.widthDecay,
          intensity * config.branchIntensityDecay,
          true
        );
      }
    } else {
      // Draw segment with possible chaos
      const currentAngle = angle(start, end);
      const chaosAngle = currentAngle + (Math.random() - 0.5) * config.chaosFactor;
      const segmentLength = Math.min(dist, config.maxSegmentLength);
      
      const segmentEnd = pointFromPolar(start, segmentLength, chaosAngle);
      
      if (addSegment({ start, end: segmentEnd, width, intensity, isBranch })) {
        // Continue towards target
        if (distance(segmentEnd, end) > config.minSegmentLength) {
          generateBolt(segmentEnd, end, depth, width * config.widthDecay, intensity, isBranch);
        }
      }
    }
  }
  
  // Generate main bolt
  generateBolt(
    config.startPoint,
    config.endPoint,
    0,
    config.baseWidth,
    1.0,
    false
  );
  
  return segments;
}

/**
 * Animate lightning parameters for dynamic effects
 */
export function animateLightningConfig(
  baseConfig: LightningConfig,
  time: number
): LightningConfig {
  return {
    ...baseConfig,
    chaosFactor: baseConfig.chaosFactor * (0.8 + 0.4 * Math.sin(time * 0.001)),
    displacementFactor: baseConfig.displacementFactor * (0.9 + 0.2 * Math.sin(time * 0.0007)),
    branchProbability: baseConfig.branchProbability * (0.7 + 0.6 * Math.sin(time * 0.0003))
  };
}

/**
 * Generate multiple lightning bolts for a strike effect
 */
export function generateLightningStrike(
  config: LightningConfig,
  boltCount: number = 3
): LightningSegment[][] {
  const bolts: LightningSegment[][] = [];
  
  for (let i = 0; i < boltCount; i++) {
    // Vary end point slightly for multiple bolts
    const variance = 20;
    const variedConfig = {
      ...config,
      endPoint: {
        x: config.endPoint.x + (Math.random() - 0.5) * variance,
        y: config.endPoint.y + (Math.random() - 0.5) * variance
      },
      baseWidth: config.baseWidth * (0.5 + 0.5 * Math.random()),
      chaosFactor: config.chaosFactor * (0.8 + 0.4 * Math.random())
    };
    
    bolts.push(generateLightning(variedConfig));
  }
  
  return bolts;
}