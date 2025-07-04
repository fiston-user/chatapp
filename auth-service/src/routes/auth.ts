import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { validateRegister, validateLogin } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { publishUserCreated } from "../queue/userEvents";

const router = Router();

// POST /register
router.post(
  "/register",
  validateRegister,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Publish user creation event for other services
    try {
      await publishUserCreated({
        userId: user.id,
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.warn('⚠️ Failed to publish user.created event:', error);
      // Don't fail the registration if event publishing fails
    }

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  })
);

// POST /login
router.post(
  "/login",
  validateLogin,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  })
);

// GET /verify - Verify token validity
router.get(
  "/verify",
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      res.json({ valid: true, payload: decoded });
    } catch (jwtError) {
      res.status(401).json({ error: "Invalid token" });
    }
  })
);

export default router;
