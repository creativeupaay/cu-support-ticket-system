import { describe, it, expect } from 'vitest';
import {
  renderTemplate,
  escapeHtml,
  validateFormResponses,
  getDefaultFormFields,
  getDefaultStages,
  CreateProjectSchema,
} from './index.js';

describe('Shared Types & Helpers', () => {
  describe('escapeHtml', () => {
    it('escapes special HTML characters', () => {
      const unsafe = '<script>alert("XSS & danger")</script>';
      const safe = escapeHtml(unsafe);
      expect(safe).toBe('&lt;script&gt;alert(&quot;XSS &amp; danger&quot;)&lt;/script&gt;');
    });
  });

  describe('renderTemplate', () => {
    it('replaces all tokens including dynamic fields and escapes HTML values', () => {
      const template = {
        subject: '[{{ticketNumber}}] Update for {{project.name}}',
        body: '<p>Hi {{field.name}}, your issue "{{field.description}}" in stage {{stageName}} can be checked at {{statusUrl}}</p>',
      };

      const context = {
        ticket: {
          ticketNumber: 'SUPP-1001',
          requesterEmail: 'test@example.com',
          formResponses: {
            name: 'Alice <b>Smith</b>',
            description: 'Button <click> broken',
          },
        },
        project: {
          name: 'Acme App',
        },
        stageName: 'In Progress',
        statusUrl: 'https://status.example.com/tok_123',
      };

      const rendered = renderTemplate(template, context);
      expect(rendered.subject).toBe('[SUPP-1001] Update for Acme App');
      expect(rendered.body).toContain('Alice &lt;b&gt;Smith&lt;/b&gt;');
      expect(rendered.body).toContain('Button &lt;click&gt; broken');
      expect(rendered.body).toContain('stage In Progress');
      expect(rendered.body).toContain('https://status.example.com/tok_123');
    });
  });

  describe('validateFormResponses', () => {
    const fields = getDefaultFormFields();

    it('successfully validates and sanitizes valid responses', () => {
      const input = {
        name: 'Bob Jones',
        email: 'bob@example.com',
        issue_type: 'Bug Report',
        description: 'Something is not working right',
        screenshot: 'https://res.cloudinary.com/demo/image.png',
      };

      const result = validateFormResponses(input, fields);
      expect(result.isValid).toBe(true);
      expect(result.requesterEmail).toBe('bob@example.com');
      expect(result.sanitized.issue_type).toBe('Bug Report');
    });

    it('catches missing required fields and invalid emails', () => {
      const input = {
        name: '',
        email: 'not-an-email',
        issue_type: 'InvalidOption',
        description: '',
      };

      const result = validateFormResponses(input, fields);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBe('Must be a valid email address');
      expect(result.errors.issue_type).toContain('Must be one of');
      expect(result.errors.description).toBeDefined();
    });
  });

  describe('CreateProjectSchema', () => {
    it('validates project creation and enforces exactly one default stage', () => {
      const valid = {
        name: 'My CRM Project',
        allowedDomains: ['https://clientapp.com'],
        formFields: getDefaultFormFields(),
        stages: getDefaultStages(),
      };

      const parsed = CreateProjectSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('fails if no stage is marked default or multiple stages are default', () => {
      const stages = getDefaultStages().map((s) => ({ ...s, isDefault: false }));
      const invalid = {
        name: 'My CRM Project',
        allowedDomains: [],
        formFields: getDefaultFormFields(),
        stages,
      };

      const parsed = CreateProjectSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0].message).toContain('Exactly one stage must be marked as default');
      }
    });
  });
});
