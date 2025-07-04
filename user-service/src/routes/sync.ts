import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { validateSyncUser } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();
const prisma = new PrismaClient();

// Internal endpoint to create user profile (called by auth-service)
router.post("/sync/user", validateSyncUser, asyncHandler(async (req: Request, res: Response) => {
  const { id, email, name } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (existingUser) {
    return res
      .status(200)
      .json({ message: "User already exists", user: existingUser });
  }

  // Create new user profile
  const user = await prisma.user.create({
    data: {
      id,
      email,
      name: name || null,
    },
  });

  res.status(201).json({ message: "User profile created", user });
}));

export default router;
