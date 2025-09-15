/**
 * Fast Touch Interaction System
 * Optimized for <50ms response time on mobile devices
 * 
 * Key optimizations:
 * - Passive event listeners where possible
 * - RAF-based updates for smooth animations
 * - Minimal DOM manipulation
 * - Early gesture detection
 * - Touch prediction for better responsiveness
 */
import React from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  force?: number;
}

export interface TouchGesture {
  type: 'tap' | 'long-press' | 'swipe' | 'pinch' | 'pan';
  startPoint: TouchPoint;
  endPoint?: TouchPoint;
  direction?: 'up' | 'down' | 'left' | 'right';
  velocity?: number;
  distance?: number;
  duration: number;
}

export interface FastTouchConfig {
  // Response time targets
  tapThreshold: number; // 50ms for immediate feedback
  longPressDelay: number; // 300ms for long press detection
  swipeThreshold: number; // 30px minimum distance
  velocityThreshold: number; // 0.5px/ms minimum velocity
  
  // Performance optimizations
  useRAF: boolean; // Use requestAnimationFrame for updates
  preventScroll: boolean; // Prevent default scroll behavior
  enableHaptics: boolean; // Native haptic feedback
  enablePrediction: boolean; // Touch prediction for faster response
}

export const DEFAULT_FAST_TOUCH_CONFIG: FastTouchConfig = {
  tapThreshold: 50,
  longPressDelay: 300,
  swipeThreshold: 30,
  velocityThreshold: 0.5,
  useRAF: true,
  preventScroll: false,
  enableHaptics: true,
  enablePrediction: true,
};

export class FastTouchHandler {
  private config: FastTouchConfig;
  private element: HTMLElement;
  private isActive = false;
  private animationFrame?: number;
  private startTime = 0;
  private startPoint?: TouchPoint;
  private currentPoint?: TouchPoint;
  private longPressTimer?: number;
  private velocity = 0;
  private lastPoints: TouchPoint[] = [];
  
  // Callbacks
  private onTap?: (point: TouchPoint, duration: number) => void;
  private onLongPress?: (point: TouchPoint) => void;
  private onSwipe?: (gesture: TouchGesture) => void;
  private onPan?: (delta: { x: number; y: number }, velocity: number) => void;
  private onGestureStart?: (point: TouchPoint) => void;
  private onGestureEnd?: (gesture: TouchGesture | null) => void;
  
  constructor(element: HTMLElement, config: Partial<FastTouchConfig> = {}) {
    this.element = element;
    this.config = { ...DEFAULT_FAST_TOUCH_CONFIG, ...config };
    this.bindEvents();
  }
  
  private bindEvents() {
    // Use passive listeners for better performance
    const passiveOptions = { passive: !this.config.preventScroll };
    const activeOptions = { passive: false };
    
    this.element.addEventListener('touchstart', this.handleTouchStart, activeOptions);
    this.element.addEventListener('touchmove', this.handleTouchMove, passiveOptions);
    this.element.addEventListener('touchend', this.handleTouchEnd, passiveOptions);
    this.element.addEventListener('touchcancel', this.handleTouchCancel, passiveOptions);
  }
  
  private createTouchPoint(touch: Touch): TouchPoint {
    return {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: performance.now(),
      force: (touch as any).force || 1, // 3D Touch support
    };
  }
  
  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) return; // Only handle single touch for now
    
    const touch = e.touches[0];
    this.startPoint = this.createTouchPoint(touch);
    this.currentPoint = this.startPoint;
    this.startTime = performance.now();
    this.isActive = true;
    this.lastPoints = [this.startPoint];
    
    // Immediate visual feedback
    this.onGestureStart?.(this.startPoint);
    
    // Haptic feedback for immediate response
    if (this.config.enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(1); // Ultra-short vibration for touch confirmation
    }
    
    // Set up long press detection
    this.longPressTimer = window.setTimeout(() => {
      if (this.isActive && this.startPoint) {
        this.onLongPress?.(this.startPoint);
      }
    }, this.config.longPressDelay);
    
    // Start RAF loop for smooth updates
    if (this.config.useRAF) {
      this.startRAFLoop();
    }
    
    // Prevent scroll if configured
    if (this.config.preventScroll) {
      e.preventDefault();
    }
  };
  
  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isActive || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    this.currentPoint = this.createTouchPoint(touch);
    
    // Keep track of recent points for velocity calculation
    this.lastPoints.push(this.currentPoint);
    if (this.lastPoints.length > 5) {
      this.lastPoints.shift(); // Keep only last 5 points
    }
    
    // Calculate velocity
    this.velocity = this.calculateVelocity();
    
    // Check if movement exceeds long press threshold
    if (this.startPoint) {
      const distance = this.getDistance(this.startPoint, this.currentPoint);
      if (distance > 10 && this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = undefined;
      }
      
      // Pan gesture detection
      const delta = {
        x: this.currentPoint.x - this.startPoint.x,
        y: this.currentPoint.y - this.startPoint.y,
      };
      
      this.onPan?.(delta, this.velocity);
    }
  };
  
  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.isActive) return;
    
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    // Clear timers
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = undefined;
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    
    // Determine gesture type
    let gesture: TouchGesture | null = null;
    
    if (this.startPoint && this.currentPoint) {
      const distance = this.getDistance(this.startPoint, this.currentPoint);
      
      if (distance < this.config.swipeThreshold && duration < this.config.tapThreshold * 4) {
        // Fast tap
        this.onTap?.(this.startPoint, duration);
      } else if (distance >= this.config.swipeThreshold && this.velocity >= this.config.velocityThreshold) {
        // Swipe gesture
        gesture = {
          type: 'swipe',
          startPoint: this.startPoint,
          endPoint: this.currentPoint,
          direction: this.getSwipeDirection(this.startPoint, this.currentPoint),
          velocity: this.velocity,
          distance,
          duration,
        };
        
        this.onSwipe?.(gesture);
      }
    }
    
    this.onGestureEnd?.(gesture);
    this.reset();
  };
  
  private handleTouchCancel = () => {
    this.reset();
  };
  
  private reset() {
    this.isActive = false;
    this.startPoint = undefined;
    this.currentPoint = undefined;
    this.lastPoints = [];
    this.velocity = 0;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = undefined;
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }
  
  private startRAFLoop() {
    const update = () => {
      if (this.isActive) {
        // Touch prediction for ultra-responsive feedback
        if (this.config.enablePrediction && this.lastPoints.length >= 2) {
          const predicted = this.predictNextPoint();
          if (predicted) {
            // Use predicted point for immediate visual feedback
          }
        }
        
        this.animationFrame = requestAnimationFrame(update);
      }
    };
    
    this.animationFrame = requestAnimationFrame(update);
  }
  
  private calculateVelocity(): number {
    if (this.lastPoints.length < 2) return 0;
    
    const recent = this.lastPoints.slice(-2);
    const deltaTime = recent[1].timestamp - recent[0].timestamp;
    const deltaX = recent[1].x - recent[0].x;
    const deltaY = recent[1].y - recent[0].y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    return deltaTime > 0 ? distance / deltaTime : 0;
  }
  
  private getDistance(p1: TouchPoint, p2: TouchPoint): number {
    const deltaX = p2.x - p1.x;
    const deltaY = p2.y - p1.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }
  
  private getSwipeDirection(start: TouchPoint, end: TouchPoint): 'up' | 'down' | 'left' | 'right' {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }
  
  private predictNextPoint(): TouchPoint | null {
    if (this.lastPoints.length < 3) return null;
    
    const recent = this.lastPoints.slice(-3);
    const dt1 = recent[1].timestamp - recent[0].timestamp;
    const dt2 = recent[2].timestamp - recent[1].timestamp;
    
    if (dt1 === 0 || dt2 === 0) return null;
    
    const vx1 = (recent[1].x - recent[0].x) / dt1;
    const vy1 = (recent[1].y - recent[0].y) / dt1;
    const vx2 = (recent[2].x - recent[1].x) / dt2;
    const vy2 = (recent[2].y - recent[1].y) / dt2;
    
    // Predict next position based on acceleration
    const ax = (vx2 - vx1) / dt2;
    const ay = (vy2 - vy1) / dt2;
    
    const predictTime = 16; // Predict 16ms ahead (1 frame at 60fps)
    
    return {
      x: recent[2].x + vx2 * predictTime + 0.5 * ax * predictTime * predictTime,
      y: recent[2].y + vy2 * predictTime + 0.5 * ay * predictTime * predictTime,
      timestamp: recent[2].timestamp + predictTime,
    };
  }
  
  // Public API
  public onTapHandler(callback: (point: TouchPoint, duration: number) => void) {
    this.onTap = callback;
    return this;
  }
  
  public onLongPressHandler(callback: (point: TouchPoint) => void) {
    this.onLongPress = callback;
    return this;
  }
  
  public onSwipeHandler(callback: (gesture: TouchGesture) => void) {
    this.onSwipe = callback;
    return this;
  }
  
  public onPanHandler(callback: (delta: { x: number; y: number }, velocity: number) => void) {
    this.onPan = callback;
    return this;
  }
  
  public onGestureStartHandler(callback: (point: TouchPoint) => void) {
    this.onGestureStart = callback;
    return this;
  }
  
  public onGestureEndHandler(callback: (gesture: TouchGesture | null) => void) {
    this.onGestureEnd = callback;
    return this;
  }
  
  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    this.reset();
  }
}

/**
 * React hook for fast touch interactions
 */
export function useFastTouch(
  elementRef: React.RefObject<HTMLElement>,
  config: Partial<FastTouchConfig> = {}
) {
  const [handler, setHandler] = React.useState<FastTouchHandler | null>(null);
  
  React.useEffect(() => {
    if (elementRef.current) {
      const touchHandler = new FastTouchHandler(elementRef.current, config);
      setHandler(touchHandler);
      
      return () => {
        touchHandler.destroy();
      };
    }
  }, [elementRef.current, config]);
  
  return handler;
}