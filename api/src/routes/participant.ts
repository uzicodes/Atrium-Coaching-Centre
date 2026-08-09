import { Router } from 'express';
import { query } from '../db';
import { requireSession } from '../auth';

const router = Router();

router.get('/bookings', requireSession, async (req, res) => {
  try {
    const personId = res.locals.personId;

    const sql = `
      select e.id as enrolment_id, e.status as enrolment_status, e.credits_charged, e.enrolled_at,
             s.id as session_id, s.discipline, s.session_type, s.status as session_status, 
             s.starts_at, s.ends_at,
             r.name as room_name,
             p.full_name as coach_name
        from enrolment e
        join session s on s.id = e.session_id
        join room r on r.id = s.room_id
        join person p on p.id = s.coach_id
       where e.person_id = $1
       order by s.starts_at desc
    `;

    const bookings = await query(sql, [personId]);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not load bookings' });
  }
});

export default router;
