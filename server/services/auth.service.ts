import { getPrismaClient } from "../utils/db";
import { logger } from "../utils/logger";
import { generateAccessToken, generateRefreshToken, TokenPayload } from "../utils/jwt";
import { RegisterSchema } from "../validators/auth.validator";
import bcrypt from "bcryptjs";

// High quality simulated Users list if PostgreSQL is not hydrated
const mockUsers = new Map<string, any>();

export class AuthService {
  async register(data: any) {
    const validated = RegisterSchema.parse(data);
    const prisma = getPrismaClient();

    const passwordHash = bcrypt.hashSync(validated.password, 10);

    if (prisma) {
      try {
        const u = await prisma.user.create({
          data: {
            email: validated.email,
            passwordHash,
            name: validated.name,
            role: (validated.role as any) || "TEAM_MEMBER",
            isEmailVerified: false
          }
        });
        logger.info(`Database: User registered successfully: ${u.email}`);
        return { id: u.id, email: u.email, name: u.name, role: u.role };
      } catch (err: any) {
        logger.error(`Prisma user registration failure: ${err.message}`);
        throw new Error("Email already registered in system");
      }
    } else {
      // In-memory simulator register
      if (mockUsers.has(validated.email)) {
        throw new Error("Email already registered in system");
      }
      const newUser = {
        id: `user-${Date.now()}`,
        email: validated.email,
        passwordHash,
        name: validated.name,
        role: validated.role || "TEAM_MEMBER"
      };
      mockUsers.set(validated.email, newUser);
      logger.info(`Simulator: User registered successfully: ${newUser.email}`);
      return { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
    }
  }

  async login(credentials: any) {
    const prisma = getPrismaClient();
    const { email, password } = credentials;

    let userRecord: any = null;

    if (prisma) {
      userRecord = await prisma.user.findUnique({ where: { email } });
    } else {
      userRecord = mockUsers.get(email);
      // Let's create a default admin user for developers if mock database is empty
      if (!userRecord && email === "dev@harnexis.io") {
        userRecord = {
          id: "dev-admin-id",
          email: "dev@harnexis.io",
          passwordHash: bcrypt.hashSync("harnexis2026", 10),
          name: "Hari Prabu",
          role: "ADMIN"
        };
        mockUsers.set(email, userRecord);
      }
    }

    if (!userRecord) {
      throw new Error("Invalid email or password");
    }

    // Direct match check utilizing bcrypt.compareSync
    const isMatched = bcrypt.compareSync(password, userRecord.passwordHash);
    if (!isMatched) {
      throw new Error("Invalid email or password");
    }

    const payload: TokenPayload = {
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token session if Prisma is present
    if (prisma) {
      try {
        await prisma.session.create({
          data: {
            userId: userRecord.id,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      } catch (e: any) {
        logger.error(`Prisma save refresh session error: ${e.message}`);
      }
    }

    return {
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role
      },
      accessToken,
      refreshToken
    };
  }

  async rotateRefreshToken(token: string) {
    const prisma = getPrismaClient();
    // In actual server, we'd look up the session, delete it, verify, then issue new ones
    if (prisma) {
      const session = await prisma.session.findUnique({ where: { refreshToken: token } });
      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid or expired refresh token session");
      }
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) throw new Error("User associated with session not found");

      const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      // Rotate session
      await prisma.session.delete({ where: { id: session.id } });
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return { accessToken, refreshToken: newRefreshToken };
    } else {
      // Simulator token rotation
      return {
        accessToken: generateAccessToken({ userId: "sim-id", email: "sim@harnexis.io", role: "TEAM_MEMBER" }),
        refreshToken: generateRefreshToken({ userId: "sim-id", email: "sim@harnexis.io", role: "TEAM_MEMBER" })
      };
    }
  }
}
