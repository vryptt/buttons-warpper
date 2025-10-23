import { ValidationErrorContext } from '../types';

export class InteractiveValidationError extends Error {
  public readonly context?: string;
  public readonly errors: string[];
  public readonly warnings: string[];
  public readonly example?: any;

  constructor(message: string, meta: ValidationErrorContext = {}) {
    super(message);
    this.name = 'InteractiveValidationError';
    this.context = meta.context;
    this.errors = meta.errors || [];
    this.warnings = meta.warnings || [];
    this.example = meta.example;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      errors: this.errors,
      warnings: this.warnings,
      example: this.example
    };
  }

  formatDetailed(): string {
    const lines: string[] = [
      `[${this.name}] ${this.message}${this.context ? ` (${this.context})` : ''}`
    ];

    if (this.errors.length > 0) {
      lines.push('Errors:', ...this.errors.map(e => `  - ${e}`));
    }

    if (this.warnings.length > 0) {
      lines.push('Warnings:', ...this.warnings.map(w => `  - ${w}`));
    }

    if (this.example) {
      lines.push('Example payload:', JSON.stringify(this.example, null, 2));
    }

    return lines.join('\n');
  }
}