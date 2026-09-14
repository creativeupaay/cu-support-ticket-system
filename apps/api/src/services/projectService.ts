import crypto from 'crypto';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Project, ProjectDocument } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { Agent } from '../models/Agent.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  getDefaultFormFields,
  getDefaultStages,
} from '@support-hub/shared-types';

export interface ProjectCreatedResult {
  project: ProjectDocument;
  projectSecret: string; // Plaintext, returned ONLY at creation
}

export interface AgentContext {
  agentId: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'employee' | 'owner' | 'agent';
  name?: string;
}

export async function createProject(
  agent: AgentContext,
  data: CreateProjectRequest
): Promise<ProjectCreatedResult> {
  // Generate random projectKey and secret
  const projectKey = `proj_${crypto.randomBytes(8).toString('hex')}`;
  const rawProjectSecret = `sec_${crypto.randomBytes(24).toString('hex')}`;
  const projectSecretHash = await bcrypt.hash(rawProjectSecret, 10);

  const formFields = data.formFields && data.formFields.length > 0 ? data.formFields : getDefaultFormFields();
  const stages = data.stages && data.stages.length > 0 ? data.stages : getDefaultStages();

  // Validate stages has exactly one default stage
  const defaultCount = stages.filter((s) => s.isDefault).length;
  if (defaultCount !== 1) {
    throw new AppError(400, 'INVALID_STAGES', 'Exactly one stage must be designated as the default stage');
  }

  const project = await Project.create({
    organizationId: agent.organizationId,
    createdBy: new mongoose.Types.ObjectId(agent.agentId),
    name: data.name,
    projectKey,
    projectSecretHash,
    allowedDomains: data.allowedDomains || [],
    formFields,
    stages,
    widgetSettings: data.widgetSettings,
    ticketCounter: 1000,
  });

  return {
    project,
    projectSecret: rawProjectSecret,
  };
}

export async function listProjects(agent: AgentContext): Promise<any[]> {
  const query: Record<string, any> = { organizationId: agent.organizationId };

  // RBAC Scoping: Employee role can only view projects they created
  const isAdmin = agent.role === 'admin' || agent.role === 'owner';
  if (!isAdmin) {
    query.createdBy = new mongoose.Types.ObjectId(agent.agentId);
  }

  const projects = await Project.find(query)
    .populate<{ createdBy: { _id: string; name: string; email: string } }>('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  const projectIds = projects.map((p) => p._id);

  const ticketCounts = await Ticket.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(ticketCounts.map((tc) => [tc._id.toString(), tc.count]));

  return projects.map((p: any) => ({
    ...p,
    creatorName: p.createdBy?.name,
    creatorEmail: p.createdBy?.email,
    createdBy: p.createdBy?._id || p.createdBy,
    ticketCount: countMap.get(p._id.toString()) || 0,
  }));
}

export async function getProjectById(
  projectId: string,
  agent: AgentContext
): Promise<any> {
  const query: Record<string, any> = {
    _id: projectId,
    organizationId: agent.organizationId,
  };

  const isAdmin = agent.role === 'admin' || agent.role === 'owner';
  if (!isAdmin) {
    query.createdBy = new mongoose.Types.ObjectId(agent.agentId);
  }

  const project = await Project.findOne(query)
    .populate<{ createdBy: { _id: string; name: string; email: string } }>('createdBy', 'name email')
    .lean();

  if (!project) {
    // Check if project exists in organization but belongs to another creator
    const existing = await Project.findOne({ _id: projectId, organizationId: agent.organizationId });
    if (existing && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this project');
    }
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }

  const ticketCount = await Ticket.countDocuments({ projectId: project._id });
  return {
    ...project,
    creatorName: (project as any).createdBy?.name,
    creatorEmail: (project as any).createdBy?.email,
    createdBy: (project as any).createdBy?._id || project.createdBy,
    ticketCount,
  };
}

export async function updateProject(
  projectId: string,
  agent: AgentContext,
  data: UpdateProjectRequest
): Promise<ProjectDocument> {
  const query: Record<string, any> = {
    _id: projectId,
    organizationId: agent.organizationId,
  };

  const isAdmin = agent.role === 'admin' || agent.role === 'owner';
  if (!isAdmin) {
    query.createdBy = new mongoose.Types.ObjectId(agent.agentId);
  }

  const project = await Project.findOne(query);
  if (!project) {
    const existing = await Project.findOne({ _id: projectId, organizationId: agent.organizationId });
    if (existing && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this project');
    }
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }

  if (data.name) project.name = data.name;
  if (data.allowedDomains) project.allowedDomains = data.allowedDomains;
  if (data.formFields) project.formFields = data.formFields;
  if (data.widgetSettings) {
    project.widgetSettings = {
      ...(project.widgetSettings ? (project.widgetSettings as any).toObject ? (project.widgetSettings as any).toObject() : project.widgetSettings : {}),
      ...data.widgetSettings,
    };
  }
  if (data.stages) {
    const defaultCount = data.stages.filter((s) => s.isDefault).length;
    if (defaultCount !== 1) {
      throw new AppError(400, 'INVALID_STAGES', 'Exactly one stage must be designated as the default stage');
    }
    project.stages = data.stages;
  }

  await project.save();
  return project;
}
