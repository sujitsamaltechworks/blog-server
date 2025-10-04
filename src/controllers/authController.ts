import { Request, Response } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { loginSchema, signUpSchema } from "../schemas/authSchema";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

export const signup = async (req: Request, res: Response) => {
  try {
    const data = signUpSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser)
      return res.status(400).json({ message: "Email is already existing" });

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    res.status(201).json({
      message: "User added successfully",
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || error.errors });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({ accessToken, refreshToken });
  } catch (error: any) {
    res.status(400).json({ error: error.message || error.errors });
  }
};
