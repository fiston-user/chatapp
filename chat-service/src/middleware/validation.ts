import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Validation schemas
export const createChatSchema = z.object({
  name: z
    .string()
    .min(1, "Chat name is required")
    .max(100, "Chat name must be less than 100 characters"),
  type: z
    .enum(["PRIVATE", "GROUP"], {
      errorMap: () => ({ message: "Type must be either PRIVATE or GROUP" }),
    })
    .optional(),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(1000, "Message content must be less than 1000 characters"),
});

export const addUserToChatSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export const chatIdSchema = z.object({
  chatId: z.string().cuid("Invalid chat ID format"),
});

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/, "Page must be a positive number").optional(),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a positive number")
    .optional(),
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
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
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
          error: "Invalid parameters",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Validate query parameters
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Specific validation middlewares
export const validateCreateChat = validateRequest(createChatSchema);
export const validateSendMessage = validateRequest(sendMessageSchema);
export const validateAddUserToChat = validateRequest(addUserToChatSchema);
export const validateChatId = validateParams(chatIdSchema);
export const validatePagination = validateQuery(paginationSchema);
