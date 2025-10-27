import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

// JWT Secret for token signing
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

// Custom authentication types
export interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
}

export interface CustomSession {
  user: CustomUser;
  token: string;
  expires: string;
}

// Custom authentication functions
export async function authenticateUser(
  email: string,
  password: string
): Promise<CustomUser | null> {
  try {
    console.log("🔐 Custom auth: Attempting login for:", email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("👤 Custom auth: User found:", user ? "YES" : "NO");
    if (user)
      console.log(
        "👤 Custom auth: User ID:",
        user.id,
        "Has password:",
        !!user.password
      );

    if (!user || !user.password) {
      console.log(
        "❌ Custom auth: Invalid credentials: User not found or no password"
      );
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("🔑 Custom auth: Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Custom auth: Invalid credentials: Password mismatch");
      return null;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || "User",
      role: user.role,
      image: user.avatar || user.image || undefined,
    };
  } catch (error) {
    console.error("❌ Custom auth error:", error);
    return null;
  }
}

export function generateJWTToken(user: CustomUser): string {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
    issuer: "ecommerce-app",
    audience: "ecommerce-users",
  });
}

export function verifyJWTToken(token: string): CustomUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      image: decoded.image,
    };
  } catch (error) {
    console.error("❌ JWT verification failed:", error);
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try to get token from cookie
  const tokenCookie = request.cookies.get("auth-token");
  return tokenCookie?.value || null;
}

export async function getServerUser(
  request: NextRequest
): Promise<CustomUser | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return null;
    }

    return verifyJWTToken(token);
  } catch (error) {
    console.error("❌ getServerUser error:", error);
    return null;
  }
}

export function createAuthResponse(
  user: CustomUser,
  token: string
): NextResponse {
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    },
  });

  // Set secure HTTP-only cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    sameSite: (process.env.SESSION_COOKIE_SAMESITE as any) || "lax",
    path: "/",
    domain: "localhost", // Hardcode for localhost development
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };

  console.log("🍪 Cookie options:", cookieOptions);
  response.cookies.set("auth-token", token, cookieOptions);

  return response;
}

export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear the auth cookie
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    sameSite: (process.env.SESSION_COOKIE_SAMESITE as any) || "lax",
    path: "/",
    domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
    maxAge: 0, // Expire immediately
  });

  return response;
}
