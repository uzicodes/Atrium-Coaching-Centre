import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireSession } from '../auth';

const router = Router();

/**
 * GET /api/calendar
 * strict role-based data masking at the API layer.
 */
router.get('/', requireSession, async (req: Request, res: Response): Promise<void> => {
  try {
    // Resolve person ID from auth middleware or req.session
    const personId = res.locals.personId || (req as any).session?.userId || (req as any).session?.personId;
    if (!personId) {
      res.status(401).json({ error: 'not signed in' });
      return;
    }

    // Resolve user kind/role
    let role = (req as any).session?.role;
    if (!role) {
      const userRows = await query(
        'select id, kind, full_name, email from person where id = $1 and active = true',
        [personId]
      );
      if (userRows.length === 0) {
        res.status(401).json({ error: 'user not found or inactive' });
        return;
      }
      role = userRows[0].kind;
    }

    const normalizedRole = String(role).toLowerCase();



    // 1. PARTICIPANT:

    if (normalizedRole === 'participant') {
      const participantSessions = await query(
        `select s.id,
                s.room_id,
                r.name as room_name,
                r.capacity as room_capacity,
                s.coach_id,
                c.full_name as coach_name,
                s.discipline,
                s.session_type,
                s.status,
                s.starts_at,
                s.ends_at,
                s.seat_fee_credits,
                e.id as enrolment_id,
                e.status as enrolment_status,
                e.credits_charged,
                e.enrolled_at
           from enrolment e
           join session s on s.id = e.session_id
           left join room r on r.id = s.room_id
           left join person c on c.id = s.coach_id
          where e.person_id = $1
            and e.status = 'active'
            and s.status <> 'cancelled'
          order by s.starts_at asc`,
        [personId]
      );

      res.json(participantSessions);
      return;
    }


    // 2. COACH:

    if (normalizedRole === 'coach') {
      const allSessions = await query(
        `select s.id,
                s.room_id,
                r.name as room_name,
                r.capacity as room_capacity,
                s.coach_id,
                c.full_name as coach_name,
                s.discipline,
                s.session_type,
                s.status,
                s.starts_at,
                s.ends_at,
                s.room_fee_credits,
                s.seat_fee_credits
           from session s
           left join room r on r.id = s.room_id
           left join person c on c.id = s.coach_id
          where s.status <> 'cancelled'
          order by s.starts_at asc`
      );

      // Fetch attendees ONLY for the current coach's own sessions
      const ownSessionIds = allSessions
        .filter((s: any) => s.coach_id === personId)
        .map((s: any) => s.id);

      const attendeesMap: Record<number, any[]> = {};

      if (ownSessionIds.length > 0) {
        const attendeeRows = await query(
          `select e.id as enrolment_id,
                  e.session_id,
                  e.person_id,
                  p.full_name as participant_name,
                  p.email as participant_email,
                  e.status as enrolment_status,
                  e.enrolled_at
             from enrolment e
             join person p on p.id = e.person_id
            where e.session_id = any($1)
              and e.status = 'active'
            order by e.enrolled_at asc`,
          [ownSessionIds]
        );

        for (const row of attendeeRows) {
          if (!attendeesMap[row.session_id]) {
            attendeesMap[row.session_id] = [];
          }
          attendeesMap[row.session_id].push({
            enrolment_id: row.enrolment_id,
            person_id: row.person_id,
            name: row.participant_name,
            email: row.participant_email,
            status: row.enrolment_status,
            enrolled_at: row.enrolled_at
          });
        }
      }

      // Map sessions according to ownership
      const sanitizedFeed = allSessions.map((s: any) => {
        if (s.coach_id === personId) {
          return {
            id: s.id,
            room_id: s.room_id,
            room_name: s.room_name,
            room_capacity: s.room_capacity,
            coach_id: s.coach_id,
            coach_name: s.coach_name,
            discipline: s.discipline,
            session_type: s.session_type,
            status: s.status,
            starts_at: s.starts_at,
            ends_at: s.ends_at,
            room_fee_credits: s.room_fee_credits,
            seat_fee_credits: s.seat_fee_credits,
            attendees: attendeesMap[s.id] || []
          };
        } else {
          return {
            id: s.id,
            starts_at: s.starts_at,
            ends_at: s.ends_at,
            status: 'busy_period'
          };
        }
      });

      res.json(sanitizedFeed);
      return;
    }

    // 3. ADMINI:

    if (normalizedRole === 'admin') {
      const allSessions = await query(
        `select s.id,
                s.room_id,
                r.name as room_name,
                r.capacity as room_capacity,
                s.coach_id,
                c.full_name as coach_name,
                s.discipline,
                s.session_type,
                s.status,
                s.starts_at,
                s.ends_at,
                s.room_fee_credits,
                s.seat_fee_credits
           from session s
           left join room r on r.id = s.room_id
           left join person c on c.id = s.coach_id
          where s.status <> 'cancelled'
          order by s.starts_at asc`
      );

      const allSessionIds = allSessions.map((s: any) => s.id);
      const attendeesMap: Record<number, any[]> = {};

      if (allSessionIds.length > 0) {
        const attendeeRows = await query(
          `select e.id as enrolment_id,
                  e.session_id,
                  e.person_id,
                  p.full_name as participant_name,
                  p.email as participant_email,
                  e.status as enrolment_status,
                  e.enrolled_at
             from enrolment e
             join person p on p.id = e.person_id
            where e.session_id = any($1)
              and e.status = 'active'
            order by e.enrolled_at asc`,
          [allSessionIds]
        );

        for (const row of attendeeRows) {
          if (!attendeesMap[row.session_id]) {
            attendeesMap[row.session_id] = [];
          }
          attendeesMap[row.session_id].push({
            enrolment_id: row.enrolment_id,
            person_id: row.person_id,
            name: row.participant_name,
            email: row.participant_email,
            status: row.enrolment_status,
            enrolled_at: row.enrolled_at
          });
        }
      }

      const adminFeed = allSessions.map((s: any) => ({
        id: s.id,
        room_id: s.room_id,
        room_name: s.room_name,
        room_capacity: s.room_capacity,
        coach_id: s.coach_id,
        coach_name: s.coach_name,
        discipline: s.discipline,
        session_type: s.session_type,
        status: s.status,
        starts_at: s.starts_at,
        ends_at: s.ends_at,
        room_fee_credits: s.room_fee_credits,
        seat_fee_credits: s.seat_fee_credits,
        attendees: attendeesMap[s.id] || []
      }));

      res.json(adminFeed);
      return;
    }

    // Default: Unauthorized role 
    res.status(403).json({ error: 'unauthorized role' });
  } catch (err) {
    console.error('Calendar endpoint error:', err);
    res.status(500).json({ error: 'could not load calendar' });
  }
});

export default router;
