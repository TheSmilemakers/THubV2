/**
 * Touch Target Audit Utility
 * Validates WCAG 2.1 AA compliance for touch targets (44px minimum)
 */

export interface TouchTargetAuditResult {
  component: string;
  hasTouch: boolean;
  touchClass: string | null;
  compliant: boolean;
  size: { width: number; height: number } | null;
}

/**
 * Audits a component for touch target compliance
 * This function checks if interactive elements meet WCAG 2.1 AA standards
 */
export const auditTouchTarget = (element: HTMLElement): TouchTargetAuditResult => {
  const componentName = element.getAttribute('data-component') || 'unknown';
  const classList = Array.from(element.classList);
  
  // Check for touch target classes
  const touchClasses = ['touch-target', 'touch-target-min'];
  const touchClass = touchClasses.find(cls => classList.includes(cls)) || null;
  
  // Check if element is interactive
  const isInteractive = 
    element.tagName === 'BUTTON' ||
    element.getAttribute('role') === 'button' ||
    element.onclick !== null ||
    element.tabIndex >= 0;
  
  if (!isInteractive) {
    return {
      component: componentName,
      hasTouch: false,
      touchClass: null,
      compliant: true, // Non-interactive elements don't need touch targets
      size: null
    };
  }
  
  // Get computed style
  const computedStyle = window.getComputedStyle(element);
  const width = parseFloat(computedStyle.width);
  const height = parseFloat(computedStyle.height);
  
  // WCAG 2.1 AA requires minimum 44px for touch targets
  const compliant = width >= 44 && height >= 44;
  
  return {
    component: componentName,
    hasTouch: !!touchClass,
    touchClass,
    compliant,
    size: { width, height }
  };
};

/**
 * Audits all interactive elements on the page
 */
export const auditPageTouchTargets = (): TouchTargetAuditResult[] => {
  const interactiveElements = document.querySelectorAll(
    'button, [role="button"], [tabindex], input, select, textarea, a'
  );
  
  return Array.from(interactiveElements).map(element => 
    auditTouchTarget(element as HTMLElement)
  );
};

/**
 * Generates a touch target compliance report
 */
export const generateTouchTargetReport = (): {
  total: number;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
  issues: TouchTargetAuditResult[];
} => {
  const results = auditPageTouchTargets();
  const interactiveResults = results.filter(r => r.hasTouch !== false);
  
  const compliant = interactiveResults.filter(r => r.compliant);
  const nonCompliant = interactiveResults.filter(r => !r.compliant);
  
  return {
    total: interactiveResults.length,
    compliant: compliant.length,
    nonCompliant: nonCompliant.length,
    complianceRate: interactiveResults.length > 0 
      ? (compliant.length / interactiveResults.length) * 100 
      : 100,
    issues: nonCompliant
  };
};

/**
 * Console logging helper for touch target audit
 */
export const logTouchTargetAudit = (): void => {
  const report = generateTouchTargetReport();
  
  console.group('🎯 Touch Target Compliance Audit');
  console.log(`Total Interactive Elements: ${report.total}`);
  console.log(`Compliant: ${report.compliant}`);
  console.log(`Non-Compliant: ${report.nonCompliant}`);
  console.log(`Compliance Rate: ${report.complianceRate.toFixed(1)}%`);
  
  if (report.issues.length > 0) {
    console.group('⚠️ Non-Compliant Elements:');
    report.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.component}:`, {
        touchClass: issue.touchClass,
        size: issue.size,
        compliant: issue.compliant
      });
    });
    console.groupEnd();
  } else {
    console.log('✅ All interactive elements are WCAG 2.1 AA compliant!');
  }
  
  console.groupEnd();
};