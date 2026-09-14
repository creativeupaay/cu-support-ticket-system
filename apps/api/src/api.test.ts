import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { seedInitialData } from './seed.js';

import bcrypt from 'bcrypt';
import { Agent } from './models/Agent.js';
import { Project } from './models/Project.js';
import { getDefaultFormFields, getDefaultStages } from '@support-hub/shared-types';

let app: any;
let mongod: any;

beforeAll(async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());

  // Seed test admin
  const passwordHash = await bcrypt.hash('admin123456', 10);
  await Agent.create({
    organizationId: 'org_test_support',
    name: 'Test Admin',
    email: 'admin@supporthub.com',
    passwordHash,
    role: 'admin',
  });

  // Seed test project
  const projectSecretHash = await bcrypt.hash('sec_demo_initial_secret_123', 10);
  await Project.create({
    organizationId: 'org_test_support',
    name: 'Acme Cloud Platform',
    projectKey: 'proj_demo_live',
    projectSecretHash,
    allowedDomains: ['*'],
    formFields: getDefaultFormFields(),
    stages: getDefaultStages(),
    ticketCounter: 1000,
  });

  app = createApp();
});

afterAll(async () => {
  await disconnectDB();
  if (mongod) {
    await mongod.stop();
  }
});

describe('Centralized Support Ticket Hub API', () => {
  let authToken = '';
  let demoProjectId = '';
  let createdTicketStatusToken = '';

  describe('Health Check', () => {
    it('GET /health returns 200 ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Agent Authentication', () => {
    it('POST /api/auth/login succeeds with valid seeded credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@supporthub.com',
          password: 'admin123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.agent.email).toBe('admin@supporthub.com');
      authToken = res.body.data.token;
    });

    it('POST /api/auth/login rejects invalid passwords', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@supporthub.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Projects Management (Authenticated Agent)', () => {
    it('GET /api/projects lists projects for the authenticated organization', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      demoProjectId = res.body.data[0]._id;
    });

    it('POST /api/projects creates a new project and returns one-time projectSecret', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Beta Mobile App',
          allowedDomains: ['https://beta.myapp.com'],
          formFields: [
            { id: 'user_name', label: 'User Name', type: 'text', required: true, order: 0 },
            { id: 'user_email', label: 'User Email', type: 'email', required: true, order: 1 },
            { id: 'msg', label: 'Feedback', type: 'textarea', required: true, order: 2 },
          ],
          stages: [
            {
              id: 'open',
              name: 'Open',
              color: '#3B82F6',
              order: 0,
              isDefault: true,
              isTerminal: false,
              emailTemplate: {
                subject: '[{{ticketNumber}}] Feedback Received',
                body: '<p>Thanks {{field.user_name}} for your feedback</p>',
              },
            },
            {
              id: 'closed',
              name: 'Closed',
              color: '#6B7280',
              order: 1,
              isDefault: false,
              isTerminal: true,
              emailTemplate: {
                subject: '[{{ticketNumber}}] Closed',
                body: '<p>Closed</p>',
              },
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.projectKey).toMatch(/^proj_/);
      expect(res.body.data.projectSecret).toMatch(/^sec_/);
    });
  });

  describe('Public Widget API (/api/public/v1)', () => {
    it('GET /api/public/v1/projects/:projectKey/schema returns form field schema and widgetSettings', async () => {
      const res = await request(app).get('/api/public/v1/projects/proj_demo_live/schema');
      expect(res.status).toBe(200);
      expect(res.body.data.projectKey).toBe('proj_demo_live');
      expect(Array.isArray(res.body.data.formFields)).toBe(true);
      expect(res.body.data.widgetSettings).toBeDefined();
      expect(res.body.data.widgetSettings.primaryColor).toBeDefined();
    });

    it('POST /api/public/v1/projects/:projectKey/tickets creates ticket & returns status link', async () => {
      const res = await request(app)
        .post('/api/public/v1/projects/proj_demo_live/tickets')
        .send({
          formResponses: {
            name: 'Clara Oswald',
            email: 'clara@tardis.org',
            issue_type: 'Feature Request',
            description: 'Add a dark theme toggle for the public documentation.',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.ticketNumber).toMatch(/^ACME-/);
      expect(res.body.data.statusToken).toBeDefined();
      expect(res.body.data.statusUrl).toContain(res.body.data.statusToken);
      createdTicketStatusToken = res.body.data.statusToken;
    });

    it('GET /api/public/v1/status/:statusToken provides unauthenticated status timeline', async () => {
      const res = await request(app).get(`/api/public/v1/status/${createdTicketStatusToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.ticketNumber).toMatch(/^ACME-/);
      expect(res.body.data.currentStage.name).toBe('Open');
      expect(Array.isArray(res.body.data.stageHistory)).toBe(true);
      expect(res.body.data.formResponses.name).toBe('Clara Oswald');
    });
  });

  describe('Agent Ticket Actions', () => {
    it('GET /api/projects/:id/tickets lists project tickets with stage filter and search', async () => {
      const res = await request(app)
        .get(`/api/projects/${demoProjectId}/tickets?search=Clara`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].requesterEmail).toBe('clara@tardis.org');

      const ticketId = res.body.data[0]._id;

      // Change stage
      const stageRes = await request(app)
        .patch(`/api/tickets/${ticketId}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stageId: 'in_review' });

      expect(stageRes.status).toBe(200);
      expect(stageRes.body.data.currentStageId).toBe('in_review');

      // Add internal note
      const noteRes = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ body: 'Checked requirement with UX team. Looks great!' });

      expect(noteRes.status).toBe(201);
      expect(noteRes.body.data.internalNotes.length).toBeGreaterThan(0);
    });
  });

  describe('RBAC Scoping (Admin vs Employee)', () => {
    let employeeToken = '';
    let employeeProjectId = '';

    beforeAll(async () => {
      // Seed an employee in the same organization
      const passwordHash = await bcrypt.hash('employee123', 10);
      await Agent.create({
        organizationId: 'org_test_support',
        name: 'Test Employee',
        email: 'employee@supporthub.com',
        passwordHash,
        role: 'employee',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@supporthub.com',
          password: 'employee123',
        });
      employeeToken = res.body.data.token;
    });

    it('Employee initially sees 0 projects when none were created by them', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('Employee cannot access or update Admin project (returns 403 Forbidden)', async () => {
      const getRes = await request(app)
        .get(`/api/projects/${demoProjectId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.error.code).toBe('FORBIDDEN');

      const patchRes = await request(app)
        .patch(`/api/projects/${demoProjectId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Hacked Name' });

      expect(patchRes.status).toBe(403);
    });

    it('Employee creates a project and can only see their own project', async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Employee Solo Project',
          allowedDomains: ['*'],
          formFields: getDefaultFormFields(),
          stages: getDefaultStages(),
        });

      expect(createRes.status).toBe(201);
      employeeProjectId = createRes.body.data._id;

      // Employee lists projects: sees only their 1 project
      const listRes = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0]._id).toBe(employeeProjectId);
    });

    it('Admin can see all projects in the organization including Employee project', async () => {
      const adminListRes = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(adminListRes.status).toBe(200);
      const projectIds = adminListRes.body.data.map((p: any) => p._id);
      expect(projectIds).toContain(employeeProjectId);
      expect(projectIds).toContain(demoProjectId);
    });
  });
});
