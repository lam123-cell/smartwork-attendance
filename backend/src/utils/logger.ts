import { query } from '../config/db';

export const logActivity = async (
  userId: string | null,
  action_type: string,
  description: string,
  entity_type?: string,
  entity_id?: string,
  ip?: string,
  user_agent?: string
) => {
  try {
    await query(`
      INSERT INTO activity_logs (
        user_id, action_type, description, entity_type, entity_id, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [userId, action_type, description, entity_type || null, entity_id || null, ip || null, user_agent || null]);
  } catch (err) {
    // Do not throw — logging failure should not break main flow
    console.warn('Failed to write activity log', err);
  }
};
