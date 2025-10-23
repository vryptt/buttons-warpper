export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ButtonValidationResult extends ValidationResult {
  cleaned: any[];
}

export interface ValidationErrorContext {
  context?: string;
  errors?: string[];
  warnings?: string[];
  example?: any;
}