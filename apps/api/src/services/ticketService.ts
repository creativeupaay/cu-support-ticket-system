import crypto from 'crypto';
import mongoose from 'mongoose';
import { Ticket, TicketDocument } from '../models/Ticket.js';
import { Project, ProjectDocument } from '../models/Project.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateFormResponses } from '@support-hub/shared-types';
import { sendStageNotificationEmail } from './emailService.js';
import { logger } from '../config/logger.js';
import { AgentContext } from './projectService.js';

function getStatusUrl(statusToken: string): string {
  const baseUrl = process.env.STATUS_PAGE_BASE_URL || 'http://localhost:5173/status';
  return `${baseUrl.replace(/\/+$/, '')}/${statusToken}`;
}

export async function createTicketFromPublicSubmission(
  project: ProjectDocument,
  rawResponses: Record<string, unknown>
): Promise<{ ticket: TicketDocument; statusUrl: string }> {
  // Validate dynamic responses against current project formFields
  const validation = validateFormResponses(rawResponses, project.formFields);
  if (!validation.isValid) {
    throw new AppError(400, 'INVALID_FORM_INPUT', 'Form response validation failed', validation.errors);
  }

  const requesterEmail = validation.requesterEmail;
  if (!requesterEmail) {
    throw new AppError(
      400,
      'MISSING_REQUESTER_EMAIL',
      'An email address is required so we can send you ticket updates'
    );
  }

  // Atomically increment counter
  const updatedProject = await Project.findByIdAndUpdate(
    project._id,
    { $inc: { ticketCounter: 1 } },
    { new: true }
  );

  const counter = updatedProject?.ticketCounter || 1001;
  const projectSlug = (project.name || 'TICK')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'TICK';
  const ticketNumber = `${projectSlug}-${counter}`;

  // Find default stage
  const defaultStage = project.stages.find((s) => s.isDefault) || project.stages[0];
  if (!defaultStage) {
    throw new AppError(500, 'NO_DEFAULT_STAGE', 'Project has no configured default stage');
  }

  // Generate unguessable status token
  const statusToken = crypto.randomBytes(24).toString('hex');
  const now = new Date().toISOString();

  const ticket = await Ticket.create({
    projectId: project._id,
    ticketNumber,
    currentStageId: defaultStage.id,
    formResponses: validation.sanitized,
    requesterEmail,
    statusToken,
    stageHistory: [
      {
        stageId: defaultStage.id,
        stageName: defaultStage.name,
        changedAt: now,
        changedBy: 'system',
      },
    ],
    internalNotes: [],
  });

  const statusUrl = getStatusUrl(statusToken);

  // Send initial received email
  if (defaultStage.emailTemplate) {
    sendStageNotificationEmail({
      ticketId: (ticket._id as mongoose.Types.ObjectId).toString(),
      projectId: (project._id as mongoose.Types.ObjectId).toString(),
      projectName: project.name,
      requesterEmail,
      ticketNumber,
      stageName: defaultStage.name,
      statusUrl,
      emailTemplate: defaultStage.emailTemplate,
      formResponses: validation.sanitized,
    }).catch((err) => {
      logger.error({ err, ticketId: ticket._id }, 'Failed to dispatch initial ticket email');
    });
  }

  return { ticket, statusUrl };
}

export interface ListTicketsOptions {
  projectId: string;
  agent: AgentContext;
  stageId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listTicketsForProject(opts: ListTicketsOptions) {
  const isAdmin = opts.agent.role === 'admin' || opts.agent.role === 'owner';
  const projectQuery: Record<string, any> = {
    _id: opts.projectId,
    organizationId: opts.agent.organizationId,
  };
  if (!isAdmin) {
    projectQuery.createdBy = new mongoose.Types.ObjectId(opts.agent.agentId);
  }

  // Verify tenant and creator ownership of project
  const project = await Project.findOne(projectQuery);
  if (!project) {
    const existing = await Project.findOne({ _id: opts.projectId, organizationId: opts.agent.organizationId });
    if (existing && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access tickets for this project');
    }
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }

  const query: Record<string, any> = { projectId: project._id };

  if (opts.stageId && opts.stageId !== 'all') {
    query.currentStageId = opts.stageId;
  }

  if (opts.search && opts.search.trim() !== '') {
    const searchRegex = new RegExp(opts.search.trim(), 'i');
    query.$or = [
      { ticketNumber: searchRegex },
      { requesterEmail: searchRegex },
      { 'internalNotes.body': searchRegex },
    ];
  }

  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(100, Math.max(1, opts.limit || 25));
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    Ticket.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Ticket.countDocuments(query),
  ]);

  return {
    tickets,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    project,
  };
}

export async function getTicketDetail(
  ticketId: string,
  agent: AgentContext
): Promise<{ ticket: TicketDocument; project: ProjectDocument }> {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new AppError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
  }

  const isAdmin = agent.role === 'admin' || agent.role === 'owner';
  const projectQuery: Record<string, any> = {
    _id: ticket.projectId,
    organizationId: agent.organizationId,
  };
  if (!isAdmin) {
    projectQuery.createdBy = new mongoose.Types.ObjectId(agent.agentId);
  }

  // Tenant and creator check
  const project = await Project.findOne(projectQuery);
  if (!project) {
    const existing = await Project.findOne({ _id: ticket.projectId, organizationId: agent.organizationId });
    if (existing && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this ticket');
    }
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Associated project not found');
  }

  return { ticket, project };
}

export async function changeTicketStage(
  ticketId: string,
  agent: AgentContext,
  newStageId: string
): Promise<{ ticket: TicketDocument; stageName: string }> {
  const { ticket, project } = await getTicketDetail(ticketId, agent);

  const targetStage = project.stages.find((s) => s.id === newStageId);
  if (!targetStage) {
    throw new AppError(400, 'INVALID_STAGE', `Stage '${newStageId}' is not defined for this project`);
  }

  const now = new Date().toISOString();
  ticket.currentStageId = newStageId;
  ticket.stageHistory.push({
    stageId: newStageId,
    stageName: targetStage.name,
    changedAt: now,
    changedBy: agent.name || agent.email || agent.agentId,
  });

  await ticket.save();

  logger.info(
    { ticketId: ticket._id, newStageId, agentId: agent.agentId, ticketNumber: ticket.ticketNumber },
    'Ticket stage updated by agent'
  );

  // Send stage change email
  const statusUrl = getStatusUrl(ticket.statusToken);
  if (targetStage.emailTemplate) {
    sendStageNotificationEmail({
      ticketId: (ticket._id as mongoose.Types.ObjectId).toString(),
      projectId: (project._id as mongoose.Types.ObjectId).toString(),
      projectName: project.name,
      requesterEmail: ticket.requesterEmail,
      ticketNumber: ticket.ticketNumber,
      stageName: targetStage.name,
      statusUrl,
      emailTemplate: targetStage.emailTemplate,
      formResponses: ticket.formResponses,
    }).catch((err) => {
      logger.error({ err, ticketId: ticket._id }, 'Failed to dispatch stage change email');
    });
  }

  return { ticket, stageName: targetStage.name };
}

export async function addInternalNote(
  ticketId: string,
  agent: AgentContext,
  body: string
): Promise<TicketDocument> {
  const { ticket } = await getTicketDetail(ticketId, agent);

  const note = {
    body,
    authorId: agent.agentId,
    authorName: agent.name || agent.email || 'Support Agent',
    createdAt: new Date().toISOString(),
  };

  ticket.internalNotes.push(note);
  await ticket.save();

  logger.info({ ticketId, authorId: agent.agentId }, 'Internal note added to ticket');
  return ticket;
}

export async function getPublicTicketStatus(statusToken: string) {
  const ticket = await Ticket.findOne({ statusToken });
  if (!ticket) {
    throw new AppError(404, 'TICKET_NOT_FOUND', 'Status page not found or link has expired');
  }

  const project = await Project.findById(ticket.projectId);
  if (!project) {
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Associated project not found');
  }

  const currentStage = project.stages.find((s) => s.id === ticket.currentStageId);

  return {
    ticketNumber: ticket.ticketNumber,
    currentStage: {
      id: ticket.currentStageId,
      name: currentStage?.name || ticket.currentStageId,
      color: currentStage?.color || '#3B82F6',
      isTerminal: currentStage?.isTerminal || false,
    },
    projectName: project.name,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    stageHistory: ticket.stageHistory.map((h) => {
      const stageObj = project.stages.find((s) => s.id === h.stageId);
      return {
        stageId: h.stageId,
        stageName: stageObj?.name || h.stageName || h.stageId,
        color: stageObj?.color || '#9CA3AF',
        changedAt: h.changedAt,
      };
    }),
    formResponses: ticket.formResponses,
    formFields: project.formFields.map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      order: f.order,
    })),
  };
}
