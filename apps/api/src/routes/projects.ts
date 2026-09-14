import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
} from '../services/projectService.js';
import { listTicketsForProject } from '../services/ticketService.js';
import { CreateProjectSchema, UpdateProjectSchema } from '@support-hub/shared-types';

export const projectsRouter = Router();

// All project routes require agent authentication
projectsRouter.use(authenticate);

projectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await listProjects(req.agent!);
    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateProjectSchema.parse(req.body);
    const result = await createProject(req.agent!, validated);

    res.status(201).json({
      data: {
        ...result.project.toJSON(),
        projectSecret: result.projectSecret, // Plaintext shown ONCE at creation
      },
    });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await getProjectById(req.params.id, req.agent!);
    res.json({ data: project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateProjectSchema.parse(req.body);
    const project = await updateProject(req.params.id, req.agent!, validated);
    res.json({ data: project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get('/:id/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stageId = req.query.stageId as string | undefined;
    const search = req.query.search as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;

    const result = await listTicketsForProject({
      projectId: req.params.id,
      agent: req.agent!,
      stageId,
      search,
      page,
      limit,
    });

    res.json({
      data: result.tickets,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
});
