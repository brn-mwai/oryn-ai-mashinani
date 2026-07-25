/**
 * Input validation utilities for API routes
 */

import { NextResponse } from "next/server";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validate that required fields exist and are non-empty
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): ValidationResult<Record<string, unknown>> {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      errors.push({ field, message: `${field} is required` });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: body };
}

/**
 * Validate string field
 */
export function validateString(
  value: unknown,
  field: string,
  options?: { minLength?: number; maxLength?: number; pattern?: RegExp }
): ValidationError | null {
  if (typeof value !== "string") {
    return { field, message: `${field} must be a string` };
  }

  if (options?.minLength && value.length < options.minLength) {
    return { field, message: `${field} must be at least ${options.minLength} characters` };
  }

  if (options?.maxLength && value.length > options.maxLength) {
    return { field, message: `${field} must be at most ${options.maxLength} characters` };
  }

  if (options?.pattern && !options.pattern.test(value)) {
    return { field, message: `${field} has invalid format` };
  }

  return null;
}

/**
 * Validate number field
 */
export function validateNumber(
  value: unknown,
  field: string,
  options?: { min?: number; max?: number; integer?: boolean }
): ValidationError | null {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (typeof num !== "number" || isNaN(num)) {
    return { field, message: `${field} must be a number` };
  }

  if (options?.integer && !Number.isInteger(num)) {
    return { field, message: `${field} must be an integer` };
  }

  if (options?.min !== undefined && num < options.min) {
    return { field, message: `${field} must be at least ${options.min}` };
  }

  if (options?.max !== undefined && num > options.max) {
    return { field, message: `${field} must be at most ${options.max}` };
  }

  return null;
}

/**
 * Validate email field
 */
export function validateEmail(value: unknown, field: string): ValidationError | null {
  if (typeof value !== "string") {
    return { field, message: `${field} must be a string` };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    return { field, message: `${field} must be a valid email address` };
  }

  return null;
}

/**
 * Validate enum field
 */
export function validateEnum<T extends string>(
  value: unknown,
  field: string,
  allowedValues: readonly T[]
): ValidationError | null {
  if (!allowedValues.includes(value as T)) {
    return {
      field,
      message: `${field} must be one of: ${allowedValues.join(", ")}`,
    };
  }

  return null;
}

/**
 * Validate Convex ID format
 */
export function validateConvexId(value: unknown, field: string): ValidationError | null {
  if (typeof value !== "string") {
    return { field, message: `${field} must be a string` };
  }

  // Convex IDs are base64-encoded and have a specific format
  if (!/^[a-z0-9]{1,32}$/i.test(value)) {
    return { field, message: `${field} has invalid ID format` };
  }

  return null;
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim();
}

/**
 * Create validation error response
 */
export function validationErrorResponse(errors: ValidationError[]) {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status: 400 }
  );
}
