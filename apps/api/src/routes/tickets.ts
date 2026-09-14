import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getTicketDetail,
  changeTicketStage,
  addInternalNote,
} from '../services/ticketService.js';
import { UpdateTicketStageSchema, AddInternalNoteSchema } from '@support-hub/shared-types';

export const ticketsRouter = Router();

// Agent authentication required
ticketsRouter.use(authenticate);

ticketsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticket, project } = await getTicketDetail(req.params.id, req.agent!);
    res.json({
      data: {
        ticket,
        project: {
          _id: project._id,
          name: project.name,
          stages: project.stages,
          formFields: project.formFields,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

ticketsRouter.patch('/:id/stage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stageId } = UpdateTicketStageSchema.parse(req.body);
    const result = await changeTicketStage(
      req.params.id,
      req.agent!,
      stageId
    );

    res.json({
      data: result.ticket,
      meta: {
        stageName: result.stageName,
      },
    });
  } catch (error) {
    next(error);
  }
});

ticketsRouter.post('/:id/notes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = AddInternalNoteSchema.parse(req.body);
    const ticket = await addInternalNote(
      req.params.id,
      req.agent!,
      body
    );

    res.status(201).json({ data: ticket });
  } catch (error) {
    next(error);
  }
});
