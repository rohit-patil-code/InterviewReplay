import { Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getUserIdFromRequest(req: Request): string | null {
    const token = req.cookies?.token;
    if (!token) return null;
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        return decoded.userId || null;
    } catch {
        return null;
    }
}

/** GET /api/profile — Returns the current user's full profile data */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const result = await pool.query(
            `SELECT id, email, first_name, last_name, display_name, bio, avatar_url,
                    display_name_last_changed_at, created_at
             FROM users WHERE id = $1`,
            [userId]
        );
        if (result.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

        const user = result.rows[0];
        const lastChanged = user.display_name_last_changed_at;
        const canChangeName = !lastChanged || (Date.now() - new Date(lastChanged).getTime()) > 30 * 24 * 60 * 60 * 1000;
        const nextChangeDate = lastChanged
            ? new Date(new Date(lastChanged).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        res.json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            bio: user.bio || '',
            avatar_url: user.avatar_url || null,
            can_change_name: canChangeName,
            next_name_change_date: canChangeName ? null : nextChangeDate,
            created_at: user.created_at,
        });
    } catch (error: any) {
        console.error('[UserController] getProfile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/** PATCH /api/profile — Updates display name (30-day cooldown), bio, and avatar_url */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const { display_name, bio, avatar_url } = req.body;

        // 1. Always save bio and avatar_url (no cooldown restrictions)
        const updates: string[] = [];
        const params: any[] = [];
        let paramIdx = 1;

        if (bio !== undefined) { updates.push(`bio = $${paramIdx++}`); params.push(bio.slice(0, 500)); }
        if (avatar_url !== undefined) { updates.push(`avatar_url = $${paramIdx++}`); params.push(avatar_url || null); }

        if (updates.length > 0) {
            params.push(userId);
            await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);
        }

        // 2. Conditionally save display_name (30-day cooldown enforced)
        if (display_name !== undefined) {
            if (!display_name.trim()) {
                res.status(400).json({ error: 'Display name cannot be empty' }); return;
            }
            if (display_name.trim().length > 50) {
                res.status(400).json({ error: 'Display name must be 50 characters or less' }); return;
            }

            const existing = await pool.query(`SELECT display_name, display_name_last_changed_at FROM users WHERE id = $1`, [userId]);
            if (existing.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

            const currentName = existing.rows[0].display_name;
            const lastChanged = existing.rows[0].display_name_last_changed_at;

            // Skip cooldown check if the name hasn't actually changed
            const nameUnchanged = currentName?.trim() === display_name.trim();
            if (!nameUnchanged && lastChanged) {
                const daysSince = (Date.now() - new Date(lastChanged).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince < 30) {
                    const nextDate = new Date(new Date(lastChanged).getTime() + 30 * 24 * 60 * 60 * 1000);
                    // Bio/avatar already saved above — just report the name cooldown as a warning
                    res.status(200).json({
                        success: true,
                        name_change_blocked: true,
                        error: `Display name can only be changed once every 30 days. Next change available on ${nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
                    });
                    return;
                }
            }

            if (!nameUnchanged) {
                await pool.query(
                    `UPDATE users SET display_name = $1, display_name_last_changed_at = NOW() WHERE id = $2`,
                    [display_name.trim(), userId]
                );
            }
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[UserController] updateProfile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


/** DELETE /api/profile — Permanently deletes user account and all related data */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        // Delete all user-related data in correct order (respecting FK constraints)
        await pool.query('DELETE FROM submissions WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM email_otps WHERE email = (SELECT email FROM users WHERE id = $1)', [userId]);
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        // Clear the auth cookie
        res.clearCookie('token');
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error: any) {
        console.error('[UserController] deleteAccount error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Keep backward compat export
export const update = updateProfile;
