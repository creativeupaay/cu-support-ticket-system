import { Resend } from 'resend';
import { logger } from '../config/logger.js';
import { renderTemplate, EmailTemplate, RenderTemplateContext } from '@support-hub/shared-types';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    resendClient = new Resend(process.env.RESEND_API_KEY.trim());
  }
  return resendClient;
}

export interface SendStageEmailOptions {
  ticketId: string;
  projectId: string;
  projectName: string;
  requesterEmail: string;
  ticketNumber: string;
  stageName: string;
  statusUrl: string;
  emailTemplate: EmailTemplate;
  formResponses?: Record<string, string | string[]>;
}

export async function sendStageNotificationEmail(opts: SendStageEmailOptions): Promise<{ success: boolean; id?: string }> {
  const context: RenderTemplateContext = {
    ticket: {
      ticketNumber: opts.ticketNumber,
      requesterEmail: opts.requesterEmail,
      formResponses: opts.formResponses,
    },
    project: {
      name: opts.projectName,
    },
    stageName: opts.stageName,
    statusUrl: opts.statusUrl,
  };

  const rendered = renderTemplate(opts.emailTemplate, context);
  const client = getResendClient();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    'Creative Upaay <noreply@creativeupaay.in>';

  if (!client) {
    logger.info(
      {
        ticketId: opts.ticketId,
        projectId: opts.projectId,
        to: opts.requesterEmail,
        subject: rendered.subject,
        statusUrl: opts.statusUrl,
      },
      '[EMAIL MOCK - RESEND_API_KEY not configured] Stage update email simulated'
    );
    return { success: true, id: `mock-${Date.now()}` };
  }

  try {
    const response = await client.emails.send({
      from: fromEmail,
      to: opts.requesterEmail,
      subject: rendered.subject,
      html: rendered.body,
    });

    if (response.error) {
      logger.error(
        {
          err: response.error,
          ticketId: opts.ticketId,
          projectId: opts.projectId,
          to: opts.requesterEmail,
        },
        'Resend email delivery failed'
      );
      return { success: false };
    }

    logger.info(
      {
        emailId: response.data?.id,
        ticketId: opts.ticketId,
        projectId: opts.projectId,
        to: opts.requesterEmail,
      },
      'Stage update email sent successfully via Resend'
    );

    // If an internal team notification email is configured, send a brief alert
    const notificationEmail = process.env.RESEND_NOTIFICATION_EMAIL;
    if (notificationEmail && notificationEmail.trim() !== '' && notificationEmail !== opts.requesterEmail) {
      client.emails.send({
        from: fromEmail,
        to: notificationEmail.trim(),
        subject: `[SupportHub Alert] ${opts.ticketNumber} moved to ${opts.stageName}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #1f2937;">
            <h3>Ticket Notification Alert</h3>
            <p><strong>Ticket:</strong> ${opts.ticketNumber}</p>
            <p><strong>Project:</strong> ${opts.projectName}</p>
            <p><strong>User:</strong> ${opts.requesterEmail}</p>
            <p><strong>Stage:</strong> ${opts.stageName}</p>
            <p><a href="${opts.statusUrl}" style="color: #4f46e5;">View Status Page</a></p>
          </div>
        `,
      }).catch((teamErr) => {
        logger.warn({ teamErr }, 'Failed to send team notification alert copy');
      });
    }

    return { success: true, id: response.data?.id };
  } catch (error) {
    logger.error(
      {
        error,
        ticketId: opts.ticketId,
        projectId: opts.projectId,
        to: opts.requesterEmail,
      },
      'Unexpected error when sending Resend email'
    );
    return { success: false };
  }
}
