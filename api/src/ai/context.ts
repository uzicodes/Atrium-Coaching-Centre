import { Request, Response } from 'express';
import { query } from '../db';

export interface UserContext {
    role: 'anonymous' | 'participant' | 'coach' | 'admin';
    personId?: number;
    email?: string;
    fullName?: string;
}


export async function resolveUserContext(req: Request, res: Response): Promise<UserContext> {
    try {
        const personId = res.locals?.personId;

        if (!personId) {
            return { role: 'anonymous' };
        }

        const result = await query(
            'select id, email, full_name, kind from person where id = $1',
            [personId]
        );

        if (!result || result.length === 0) {
            return { role: 'anonymous' };
        }

        const user = result[0];
        const kind = user.kind?.toLowerCase();

        if (kind === 'admin') {
            return { role: 'admin', personId: user.id, email: user.email, fullName: user.full_name };
        }
        if (kind === 'coach') {
            return { role: 'coach', personId: user.id, email: user.email, fullName: user.full_name };
        }
        if (kind === 'participant') {
            return { role: 'participant', personId: user.id, email: user.email, fullName: user.full_name };
        }

        return { role: 'anonymous' };
    } catch (error) {
        console.error('[Context Resolution Error]:', error);
        return { role: 'anonymous' };
    }
}