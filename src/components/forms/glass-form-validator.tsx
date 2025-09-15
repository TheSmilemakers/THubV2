'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier } from '@/lib/hooks';

/**
 * GlassFormValidator Component - Comprehensive form validation with glassmorphism styling
 * 
 * Features:
 * - Real-time validation with debouncing
 * - Field-level and form-level validation
 * - Custom validation rules and messages
 * - Visual validation feedback with animations
 * - Validation summary with error aggregation
 * - Touch-optimized error display
 * - Adaptive glassmorphism effects
 * - Schema-based validation support
 * - Async validation support
 * - Accessibility compliance
 */

export type ValidationRule = {
  name: string;
  test: (value: any, formData?: Record<string, any>) => boolean | Promise<boolean>;
  message: string;
  severity?: 'error' | 'warning' | 'info';
};

export type FieldValidation = {
  value: any;
  rules: ValidationRule[];
  touched: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  infos: ValidationResult[];
};

export type ValidationResult = {
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
};

export interface GlassFormValidatorProps {
  children: ReactNode;
  validationSchema?: Record<string, ValidationRule[]>;
  onValidationChange?: (isValid: boolean, errors: Record<string, ValidationResult[]>) => void;
  showSummary?: boolean;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  className?: string;
  summaryClassName?: string;
}

interface FormValidatorContextType {
  registerField: (name: string, rules: ValidationRule[]) => void;
  unregisterField: (name: string) => void;
  validateField: (name: string, value: any, touched?: boolean) => Promise<ValidationResult[]>;
  setFieldValue: (name: string, value: any, shouldValidate?: boolean) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  getFieldValidation: (name: string) => FieldValidation | undefined;
  isFormValid: boolean;
  formErrors: Record<string, ValidationResult[]>;
}

const FormValidatorContext = React.createContext<FormValidatorContextType | null>(null);

export const useFormValidator = () => {
  const context = React.useContext(FormValidatorContext);
  if (!context) {
    throw new Error('useFormValidator must be used within a GlassFormValidator');
  }
  return context;
};

const GlassFormValidator: React.FC<GlassFormValidatorProps> = ({
  children,
  validationSchema = {},
  onValidationChange,
  showSummary = true,
  debounceMs = 300,
  validateOnChange = true,
  validateOnBlur = true,
  className,
  summaryClassName,
}) => {
  const [fields, setFields] = useState<Record<string, FieldValidation>>({});
  const [isFormValid, setIsFormValid] = useState(true);
  const [debounceTimeouts, setDebounceTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();

  // Validation engine
  const validateValue = async (rules: ValidationRule[], value: any, formData: Record<string, any>): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];
    
    for (const rule of rules) {
      try {
        const isValid = await rule.test(value, formData);
        if (!isValid) {
          results.push({
            rule: rule.name,
            message: rule.message,
            severity: rule.severity || 'error'
          });
        }
      } catch (error) {
        results.push({
          rule: rule.name,
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        });
      }
    }
    
    return results;
  };

  // Get current form data
  const getFormData = useCallback(() => {
    return Object.keys(fields).reduce((acc, fieldName) => {
      acc[fieldName] = fields[fieldName].value;
      return acc;
    }, {} as Record<string, any>);
  }, [fields]);

  // Field registration
  const registerField = useCallback((name: string, rules: ValidationRule[]) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        value: undefined,
        rules: [...rules, ...(validationSchema[name] || [])],
        touched: false,
        errors: [],
        warnings: [],
        infos: []
      }
    }));
  }, [validationSchema]);

  const unregisterField = useCallback((name: string) => {
    setFields(prev => {
      const newFields = { ...prev };
      delete newFields[name];
      return newFields;
    });
    
    setDebounceTimeouts(prev => {
      if (prev[name]) {
        clearTimeout(prev[name]);
        const newTimeouts = { ...prev };
        delete newTimeouts[name];
        return newTimeouts;
      }
      return prev;
    });
  }, []);

  // Field validation
  const validateField = useCallback(async (name: string, value: any, touched = false): Promise<ValidationResult[]> => {
    const field = fields[name];
    if (!field) return [];
    
    const formData = getFormData();
    const results = await validateValue(field.rules, value, formData);
    
    const errors = results.filter(r => r.severity === 'error');
    const warnings = results.filter(r => r.severity === 'warning');
    const infos = results.filter(r => r.severity === 'info');
    
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        touched,
        errors,
        warnings,
        infos
      }
    }));
    
    return results;
  }, [fields, getFormData]);

  // Field value setter
  const setFieldValue = useCallback((name: string, value: any, shouldValidate = validateOnChange) => {
    if (shouldValidate && debounceMs > 0) {
      // Clear existing timeout
      if (debounceTimeouts[name]) {
        clearTimeout(debounceTimeouts[name]);
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        validateField(name, value, fields[name]?.touched);
      }, debounceMs);
      
      setDebounceTimeouts(prev => ({
        ...prev,
        [name]: timeout
      }));
    } else if (shouldValidate) {
      validateField(name, value, fields[name]?.touched);
    }
    
    // Update value immediately
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value
      }
    }));
  }, [validateOnChange, debounceMs, debounceTimeouts, validateField, fields]);

  // Field touched setter
  const setFieldTouched = useCallback((name: string, touched: boolean) => {
    if (touched && validateOnBlur) {
      const field = fields[name];
      if (field) {
        validateField(name, field.value, true);
      }
    } else {
      setFields(prev => ({
        ...prev,
        [name]: {
          ...prev[name],
          touched
        }
      }));
    }
  }, [validateOnBlur, fields, validateField]);

  // Get field validation state
  const getFieldValidation = useCallback((name: string): FieldValidation | undefined => {
    return fields[name];
  }, [fields]);

  // Calculate form validity
  useEffect(() => {
    const formErrors: Record<string, ValidationResult[]> = {};
    let hasErrors = false;
    
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const allResults = [...field.errors, ...field.warnings, ...field.infos];
      if (allResults.length > 0) {
        formErrors[fieldName] = allResults;
      }
      if (field.errors.length > 0) {
        hasErrors = true;
      }
    });
    
    const newIsValid = !hasErrors;
    setIsFormValid(newIsValid);
    
    onValidationChange?.(newIsValid, formErrors);
  }, [fields, onValidationChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [debounceTimeouts]);

  // Context value
  const contextValue: FormValidatorContextType = {
    registerField,
    unregisterField,
    validateField,
    setFieldValue,
    setFieldTouched,
    getFieldValidation,
    isFormValid,
    formErrors: Object.keys(fields).reduce((acc, fieldName) => {
      const field = fields[fieldName];
      const allResults = [...field.errors, ...field.warnings, ...field.infos];
      if (allResults.length > 0) {
        acc[fieldName] = allResults;
      }
      return acc;
    }, {} as Record<string, ValidationResult[]>)
  };

  // Get summary data
  const getSummaryData = () => {
    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];
    const infos: ValidationResult[] = [];
    
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      errors.push(...field.errors);
      warnings.push(...field.warnings);
      infos.push(...field.infos);
    });
    
    return { errors, warnings, infos };
  };

  const summaryData = getSummaryData();
  const hasSummaryContent = summaryData.errors.length > 0 || summaryData.warnings.length > 0 || summaryData.infos.length > 0;

  // Validation summary component
  const ValidationSummary = () => {
    if (!showSummary || !hasSummaryContent) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          className={cn(
            'mb-6 p-4 rounded-xl border',
            adaptiveGlass.effects ? 'glass-light backdrop-blur-sm' : 'bg-black/20',
            summaryData.errors.length > 0 
              ? 'border-status-error bg-status-error/5'
              : summaryData.warnings.length > 0
                ? 'border-yellow-400 bg-yellow-400/5'
                : 'border-blue-400 bg-blue-400/5',
            'gpu-accelerated',
            summaryClassName
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-3">
            {/* Summary icon */}
            <div className="flex-shrink-0 mt-0.5">
              {summaryData.errors.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-status-error" />
              ) : summaryData.warnings.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              ) : (
                <Info className="w-5 h-5 text-blue-400" />
              )}
            </div>
            
            {/* Summary content */}
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-medium mb-2',
                summaryData.errors.length > 0 
                  ? 'text-status-error'
                  : summaryData.warnings.length > 0
                    ? 'text-yellow-400'
                    : 'text-blue-400'
              )}>
                Form Validation Summary
              </h4>
              
              {/* Error list */}
              {summaryData.errors.length > 0 && (
                <div className="space-y-1 mb-3">
                  <p className="text-sm font-medium text-status-error">
                    Errors ({summaryData.errors.length}):
                  </p>
                  <ul className="space-y-1">
                    {summaryData.errors.map((error, index) => (
                      <motion.li
                        key={`error-${index}`}
                        className="text-sm text-status-error flex items-start gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="w-1 h-1 rounded-full bg-status-error flex-shrink-0 mt-2" />
                        {error.message}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Warning list */}
              {summaryData.warnings.length > 0 && (
                <div className="space-y-1 mb-3">
                  <p className="text-sm font-medium text-yellow-400">
                    Warnings ({summaryData.warnings.length}):
                  </p>
                  <ul className="space-y-1">
                    {summaryData.warnings.map((warning, index) => (
                      <motion.li
                        key={`warning-${index}`}
                        className="text-sm text-yellow-400 flex items-start gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="w-1 h-1 rounded-full bg-yellow-400 flex-shrink-0 mt-2" />
                        {warning.message}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Info list */}
              {summaryData.infos.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-400">
                    Information ({summaryData.infos.length}):
                  </p>
                  <ul className="space-y-1">
                    {summaryData.infos.map((info, index) => (
                      <motion.li
                        key={`info-${index}`}
                        className="text-sm text-blue-400 flex items-start gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                        {info.message}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <FormValidatorContext.Provider value={contextValue}>
      <div className={cn('relative', className)}>
        <ValidationSummary />
        {children}
      </div>
    </FormValidatorContext.Provider>
  );
};

// Field validation hook
export const useFieldValidation = (name: string, rules: ValidationRule[] = []) => {
  const validator = useFormValidator();
  
  useEffect(() => {
    validator.registerField(name, rules);
    return () => validator.unregisterField(name);
  }, [validator, name, rules]);
  
  const fieldValidation = validator.getFieldValidation(name);
  
  return {
    value: fieldValidation?.value,
    errors: fieldValidation?.errors || [],
    warnings: fieldValidation?.warnings || [],
    infos: fieldValidation?.infos || [],
    touched: fieldValidation?.touched || false,
    hasErrors: (fieldValidation?.errors.length || 0) > 0,
    hasWarnings: (fieldValidation?.warnings.length || 0) > 0,
    setValue: (value: any, shouldValidate?: boolean) => validator.setFieldValue(name, value, shouldValidate),
    setTouched: (touched: boolean) => validator.setFieldTouched(name, touched),
    validate: (value: any) => validator.validateField(name, value, true)
  };
};

// Common validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    name: 'required',
    test: (value) => value != null && value !== '' && value !== false,
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    test: (value) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    test: (value) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`
  }),
  
  email: (message = 'Must be a valid email address'): ValidationRule => ({
    name: 'email',
    test: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),
  
  numeric: (message = 'Must be a number'): ValidationRule => ({
    name: 'numeric',
    test: (value) => !value || !isNaN(Number(value)),
    message
  }),
  
  min: (min: number, message?: string): ValidationRule => ({
    name: 'min',
    test: (value) => !value || Number(value) >= min,
    message: message || `Must be at least ${min}`
  }),
  
  max: (max: number, message?: string): ValidationRule => ({
    name: 'max',
    test: (value) => !value || Number(value) <= max,
    message: message || `Must be no more than ${max}`
  }),
  
  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    name: 'pattern',
    test: (value) => !value || regex.test(value),
    message
  }),
  
  custom: (test: (value: any, formData?: Record<string, any>) => boolean | Promise<boolean>, message: string, name = 'custom'): ValidationRule => ({
    name,
    test,
    message
  })
};

export { GlassFormValidator };