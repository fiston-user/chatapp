import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional()
});

export const syncUserSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional()
});

export const userIdSchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
});

// Generic validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Validate URL parameters
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Specific validation middlewares
export const validateUpdateProfile = validateRequest(updateProfileSchema);
export const validateSyncUser = validateRequest(syncUserSchema);
export const validateUserId = validateParams(userIdSchema);