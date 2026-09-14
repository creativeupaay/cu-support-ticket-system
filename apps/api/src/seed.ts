import bcrypt from 'bcrypt';
import { Agent } from './models/Agent.js';
import { Project } from './models/Project.js';
import { logger } from './config/logger.js';

export async function seedInitialData(): Promise<void> {
  try {
    const password = 'Creative@123!';
    const passwordHash = await bcrypt.hash(password, 10);
    const organizationId = 'org_main_hub';

    // 1. Seed / Upsert Primary Admin account: admin@creativeupaay.com
    const adminUser = await Agent.findOneAndUpdate(
      { email: 'admin@creativeupaay.com' },
      {
        organizationId,
        name: 'Creative Upaay Admin',
        email: 'admin@creativeupaay.com',
        passwordHash,
        role: 'admin',
      },
      { upsert: true, new: true }
    );

    // Also alias/ensure creativeupaay.com has admin role & valid password
    await Agent.findOneAndUpdate(
      { email: 'creativeupaay.com' },
      {
        organizationId,
        name: 'Creative Upaay Admin',
        email: 'creativeupaay.com',
        passwordHash,
        role: 'admin',
      },
      { upsert: true, new: true }
    );

    // 2. Seed / Upsert Employee account: creative.amitsunda@gmail.com
    const employeeUser = await Agent.findOneAndUpdate(
      { email: 'creative.amitsunda@gmail.com' },
      {
        organizationId,
        name: 'Amit Sunda',
        email: 'creative.amitsunda@gmail.com',
        passwordHash,
        role: 'employee',
      },
      { upsert: true, new: true }
    );

    // 3. Ensure all existing projects without createdBy are linked to adminUser
    if (adminUser) {
      const updateResult = await Project.updateMany(
        {
          $or: [
            { createdBy: { $exists: false } },
            { createdBy: null },
          ],
        },
        { $set: { createdBy: adminUser._id } }
      );
      if (updateResult.modifiedCount > 0) {
        logger.info({ modifiedCount: updateResult.modifiedCount }, 'Assigned legacy projects to admin');
      }
    }

    logger.info(
      {
        admin: adminUser.email,
        employee: employeeUser.email,
      },
      'Seeded Admin and Employee accounts successfully'
    );
  } catch (error) {
    logger.error({ error }, 'Error during initial data verification');
  }
}

