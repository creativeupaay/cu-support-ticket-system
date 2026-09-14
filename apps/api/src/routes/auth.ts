import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Agent } from '../models/Agent.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { LoginRequestSchema, RegisterRequestSchema } from '@support-hub/shared-types';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginRequestSchema.parse(req.body);
    const normalized = email.toLowerCase().trim();

    const agent = await Agent.findOne({ email: normalized }).select('+passwordHash');

    if (!agent) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, agent.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    const token = jwt.sign(
      {
        agentId: (agent._id as any).toString(),
        organizationId: agent.organizationId,
        email: agent.email,
        role: agent.role,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      data: {
        token,
        agent: {
          id: agent._id,
          organizationId: agent.organizationId,
          name: agent.name,
          email: agent.email,
          role: agent.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, organizationName } = RegisterRequestSchema.parse(req.body);

    const existing = await Agent.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const organizationId = `org_${Date.now()}`;

    const agent = await Agent.create({
      organizationId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
    });

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    const token = jwt.sign(
      {
        agentId: (agent._id as any).toString(),
        organizationId: agent.organizationId,
        email: agent.email,
        role: agent.role,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      data: {
        token,
        agent: {
          id: agent._id,
          organizationId: agent.organizationId,
          name: agent.name,
          email: agent.email,
          role: agent.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await Agent.findById(req.agent!.agentId);
    if (!agent) {
      throw new AppError(404, 'AGENT_NOT_FOUND', 'Agent profile not found');
    }

    res.json({
      data: {
        agent: {
          id: agent._id,
          organizationId: agent.organizationId,
          name: agent.name,
          email: agent.email,
          role: agent.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
