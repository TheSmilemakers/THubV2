import { SignalStrength } from '@/types/database.types';
import { logger } from '@/lib/logger';

export interface LayerScores {
  technical: number;
  sentiment: number;
  liquidity: number;
}

export interface ConvergenceResult {
  score: number;
  strength: SignalStrength;
  breakdown: {
    technical: number;
    sentiment: number;
    liquidity: number;
  };
}

export interface ScoringWeights {
  technical: number;
  sentiment: number;
  liquidity: number;
}

/**
 * Service responsible for calculating convergence scores from multi-layer analysis
 * Uses weighted average of technical, sentiment, and liquidity scores
 */
export class ScoringService {
  private logger = logger.createChild('ScoringService');
  
  // Default weights following 40-30-30 distribution
  private weights: ScoringWeights = {
    technical: 0.4,
    sentiment: 0.3,
    liquidity: 0.3
  };

  constructor(customWeights?: Partial<ScoringWeights>) {
    if (customWeights) {
      this.weights = { ...this.weights, ...customWeights };
      this.validateWeights();
    }
    this.logger.info('ScoringService initialized', { weights: this.weights });
  }

  /**
   * Calculate convergence score from individual layer scores
   */
  calculateConvergence(scores: LayerScores): ConvergenceResult {
    try {
      // Validate input scores
      this.validateScores(scores);

      // Calculate weighted average
      const weightedScore = 
        scores.technical * this.weights.technical +
        scores.sentiment * this.weights.sentiment +
        scores.liquidity * this.weights.liquidity;

      // Round to integer
      const finalScore = Math.round(weightedScore);
      
      // Determine signal strength
      const strength = this.getSignalStrength(finalScore);

      // Calculate individual contributions
      const breakdown = {
        technical: Math.round(scores.technical * this.weights.technical),
        sentiment: Math.round(scores.sentiment * this.weights.sentiment),
        liquidity: Math.round(scores.liquidity * this.weights.liquidity)
      };

      this.logger.debug('Convergence calculated', {
        input: scores,
        output: { score: finalScore, strength },
        breakdown
      });

      return {
        score: finalScore,
        strength,
        breakdown
      };
    } catch (error) {
      this.logger.error('Failed to calculate convergence', error);
      throw error;
    }
  }

  /**
   * Determine signal strength based on convergence score
   */
  private getSignalStrength(score: number): SignalStrength {
    if (score >= 80) return 'VERY_STRONG';
    if (score >= 70) return 'STRONG';
    if (score >= 60) return 'MODERATE';
    return 'WEAK';
  }

  /**
   * Validate input scores are within valid range
   */
  private validateScores(scores: LayerScores): void {
    const layers = ['technical', 'sentiment', 'liquidity'] as const;
    
    for (const layer of layers) {
      const score = scores[layer];
      if (typeof score !== 'number' || isNaN(score)) {
        throw new Error(`Invalid ${layer} score: must be a number`);
      }
      if (score < 0 || score > 100) {
        throw new Error(`Invalid ${layer} score: must be between 0 and 100`);
      }
    }
  }

  /**
   * Validate weights sum to 1 and are positive
   */
  private validateWeights(): void {
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    
    if (Math.abs(sum - 1) > 0.001) {
      throw new Error(`Weights must sum to 1, got ${sum}`);
    }

    for (const [key, value] of Object.entries(this.weights)) {
      if (value < 0 || value > 1) {
        throw new Error(`Invalid weight for ${key}: must be between 0 and 1`);
      }
    }
  }

  /**
   * Get current weights
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }

  /**
   * Update weights dynamically
   */
  updateWeights(newWeights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
    this.validateWeights();
    this.logger.info('Weights updated', { weights: this.weights });
  }

  /**
   * Check if a score qualifies for signal generation
   */
  isSignalWorthy(score: number): boolean {
    return score >= 70; // Only STRONG and VERY_STRONG signals
  }

  /**
   * Get score threshold for a given signal strength
   */
  getThreshold(strength: SignalStrength): number {
    switch (strength) {
      case 'VERY_STRONG': return 80;
      case 'STRONG': return 70;
      case 'MODERATE': return 60;
      case 'WEAK': return 0;
    }
  }
}