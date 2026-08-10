import { Router } from 'express';
import { query, withTransaction } from '../db';
import { requireSession } from '../auth';
import { hoursOfNotice, refundAmount, refundPercent } from '../credits';
import { sendEmail } from '../email';

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

router.post('/bookings/:id/cancel', requireSession, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'not found' });
    const personId = res.locals.personId;

    const result = await withTransaction(async (client) => {
      const enrols = await client.query(`
        select e.*, s.starts_at, s.coach_id, p.full_name as participant_name
          from enrolment e
          join session s on s.id = e.session_id
          join person p on p.id = e.person_id
         where e.id = $1 for update
      `, [id]);

      if (enrols.rowCount === 0) throw new Error('NOT_FOUND');
      const enrolment = enrols.rows[0];

      if (enrolment.person_id !== personId) throw new Error('FORBIDDEN');
      if (enrolment.status === 'cancelled') throw new Error('ALREADY_CANCELLED');

      const percent = refundPercent(hoursOfNotice(new Date(), new Date(enrolment.starts_at)));
      const refund = refundAmount(Number(enrolment.credits_charged), percent);

      await client.query(
        `update enrolment set status = 'cancelled', credits_refunded = $1, cancelled_at = now() where id = $2`,
        [refund, id]
      );
      await client.query(`update person set credits = credits + $1 where id = $2`, [refund, personId]);

      try {
        const coaches = await client.query('select email from person where id = $1', [enrolment.coach_id]);
        if (coaches.rows.length > 0) {
          await sendEmail({
            to: coaches.rows[0].email,
            subject: 'Participant Cancellation',
            text: `Participant ${enrolment.participant_name} cancelled their booking for session on ${new Date(enrolment.starts_at).toLocaleString()}.`
          });
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr);
      }

      return { status: 'cancelled', refund };
    });

    res.json(result);
  } catch (err: any) {
    console.error(err);
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'not found' });
    if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'forbidden' });
    if (err.message === 'ALREADY_CANCELLED') return res.status(400).json({ error: 'already cancelled' });
    res.status(500).json({ error: 'could not cancel' });
  }
});

export default router;