import { Router } from 'express';
import { query, withTransaction } from '../db';
import { requireSession } from '../auth';
import { hoursOfNotice, refundAmount, refundPercent, roomFee, seatFee } from '../credits';
import { sendEmail } from '../email';

const router = Router();

const UPDATABLE_FIELDS = [
  'room_id',
  'coach_id',
  'discipline',
  'session_type',
  'status',
  'starts_at',
  'ends_at'
];

router.get('/', async (req, res) => {
  try {
    const from = typeof req.query.from === 'string' && req.query.from ? req.query.from : new Date().toISOString();
    const to = typeof req.query.to === 'string' && req.query.to ? req.query.to : null;

    const params: unknown[] = [from];
    let sql = `select s.id, s.room_id, s.coach_id, s.discipline, s.session_type, s.status,
                      s.starts_at, s.ends_at, s.room_fee_credits, s.seat_fee_credits,
                      r.name  as room_name,
                      r.capacity as room_capacity,
                      p.full_name as coach_name,
                      coalesce(e.cnt, 0) as enrolled_count
                 from session s
                 left join room r on r.id = s.room_id
                 left join person p on p.id = s.coach_id
                 left join lateral (
                   select count(*)::int as cnt
                     from enrolment
                    where session_id = s.id and status = 'active'
                 ) e on true
                where s.starts_at >= $1
                  and s.status <> 'cancelled'`;

    if (to) {
      params.push(to);
      sql += ` and s.starts_at < $${params.length}`;
    }

    sql += ' order by s.starts_at';

    const rows = await query(sql, params);

    const feed = rows.map((row: any) => ({
      ...row,
      places_remaining: (row.room_capacity ?? 0) - (row.enrolled_count ?? 0)
    }));

    res.json(feed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not load the calendar' });
  }
});

router.get('/:id', requireSession, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(404).json({ error: 'no such session' });
      return;
    }

    const sessions = await query('select * from session where id = $1', [id]);

    if (sessions.length === 0) {
      res.status(404).json({ error: 'no such session' });
      return;
    }

    const session = sessions[0];
    const rooms = await query('select id, name, capacity from room where id = $1', [session.room_id]);
    const coaches = await query('select id, full_name, email from person where id = $1', [session.coach_id]);
    const attendees = await query(
      `select e.id, e.status, e.credits_charged, e.credits_refunded, e.enrolled_at, e.cancelled_at,
              p.id as person_id, p.full_name, p.email
         from enrolment e
         join person p on p.id = e.person_id
        where e.session_id = $1
        order by e.id`,
      [id]
    );

    res.json({
      ...session,
      room: rooms.length > 0 ? rooms[0] : null,
      coach: coaches.length > 0 ? coaches[0] : null,
      attendees
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not load the session' });
  }
});

router.post('/', requireSession, async (req, res) => {
  try {
    const body = req.body || {};
    const { room_id, discipline, session_type, starts_at } = body;
    const coach_id = res.locals.personId;

    if (!room_id || !discipline || !session_type || !starts_at) {
      res.status(400).json({
        error: 'room_id, discipline, session_type and starts_at are all required'
      });
      return;
    }


    const typeKey = String(session_type).toLowerCase();
    let durationMins = 45; // SHORT is 45 minutes
    if (typeKey === 'standard') durationMins = 60; // STANDARD is 60 minutes
    if (typeKey === 'intensive') durationMins = 210; // INTENSIVE is 210 mins (180 teaching + 30 lunch)

    const startsAtDate = new Date(starts_at);
    const endsAtDate = new Date(startsAtDate.getTime() + durationMins * 60 * 1000);
    const ends_at = endsAtDate.toISOString();

    const rooms = await query('select id, name, capacity from room where id = $1', [room_id]);
    if (rooms.length === 0) {
      res.status(400).json({ error: 'no such room' });
      return;
    }

    const coaches = await query('select id, credits from person where id = $1', [coach_id]);
    if (coaches.length === 0) {
      res.status(400).json({ error: 'no such coach' });
      return;
    }

    const clashes = await query(
      `select id, starts_at, ends_at
         from session
        where room_id = $1
          and status <> 'cancelled'
          and starts_at < $3
          and ends_at > $2
        limit 1`,
      [room_id, starts_at, ends_at]
    );

    if (clashes.length > 0) {
      res.status(409).json({ error: `${rooms[0].name} is already booked for that time` });
      return;
    }

    const fee = roomFee(session_type);
    const seat = seatFee(session_type);

    const created = await withTransaction(async (client) => {
      const updated = await client.query('update person set credits = credits - $1 where id = $2 and credits >= $1 returning id', [fee, coach_id]);

      if (updated.rowCount === 0) {
        throw new Error('Insufficient credits');
      }

      const inserted = await client.query(
        `insert into session
           (room_id, coach_id, discipline, session_type, status, starts_at, ends_at,
            room_fee_credits, seat_fee_credits)
         values ($1, $2, $3, $4, 'scheduled', $5, $6, $7, $8)
         returning *`,
        [room_id, coach_id, discipline, session_type, starts_at, ends_at, fee, seat]
      );

      return inserted.rows[0];
    });

    const admins = await query("select email from person where kind = 'admin'");
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'New Session Booked',
        text: `A new ${session_type} session was scheduled in room ${room_id} starting at ${new Date(starts_at).toLocaleString()}.`
      });
    }

    res.status(201).json(created);
  } catch (err: any) {
    console.error(err);
    if (err.message === 'Insufficient credits') {
      res.status(400).json({ error: 'Insufficient credits' });
    } else {
      res.status(500).json({ error: 'could not create the session' });
    }
  }
});

router.patch('/:id', requireSession, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(404).json({ error: 'no such session' });
      return;
    }

    const body = req.body || {};

    const assignments: string[] = [];
    const params: unknown[] = [];

    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) {
        params.push(body[field]);
        assignments.push(`${field} = $${params.length}`);
      }
    }

    if (assignments.length === 0) {
      res.status(400).json({ error: 'nothing to update' });
      return;
    }

    params.push(id);

    const updated = await query(
      `update session set ${assignments.join(', ')} where id = $${params.length} returning *`,
      params
    );

    if (updated.length === 0) {
      res.status(404).json({ error: 'no such session' });
      return;
    }

    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not update the session' });
  }
});

router.post('/:id/cancel', requireSession, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(404).json({ error: 'no such session' });
      return;
    }

    const sessions = await query('select * from session where id = $1', [id]);

    if (sessions.length === 0) {
      res.status(404).json({ error: 'no such session' });
      return;
    }

    const session = sessions[0];
    if (session.status === 'cancelled') {
      res.status(409).json({ error: 'that session is already cancelled' });
      return;
    }

    const percent = refundPercent(hoursOfNotice(new Date(), new Date(session.starts_at)));
    const roomRefund = refundAmount(Number(session.room_fee_credits), percent);

    const summary = await withTransaction(async (client) => {
      const enrolments = await client.query(
        "select e.id, e.person_id, e.credits_charged, p.email from enrolment e join person p on p.id = e.person_id where e.session_id = $1 and e.status = 'active'",
        [id]
      );

      let seatsRefunded = 0;

      for (const enrolment of enrolments.rows) {
        const refund = refundAmount(Number(enrolment.credits_charged), percent);

        await client.query(
          `update enrolment
              set status = 'cancelled', credits_refunded = $1, cancelled_at = now()
            where id = $2`,
          [refund, enrolment.id]
        );

        await client.query('update person set credits = credits + $1 where id = $2', [
          refund,
          enrolment.person_id
        ]);

        seatsRefunded += refund;
      }

      await client.query('update person set credits = credits + $1 where id = $2', [
        roomRefund,
        session.coach_id
      ]);

      await client.query("update session set status = 'cancelled' where id = $1", [id]);

      return { enrolments: enrolments.rowCount, seatsRefunded, emails: enrolments.rows.map((r: any) => r.email) };
    });

    const admins = await query("select email from person where kind = 'admin'");
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'Session Cancelled',
        text: `Session ${id} has been cancelled by the coach.`
      });
    }

    for (const email of summary.emails) {
      await sendEmail({
        to: email,
        subject: 'Session Cancelled',
        text: `The session ${id} you were enrolled in has been cancelled. Your credits have been refunded.`
      });
    }

    res.json({
      id,
      status: 'cancelled',
      refund_percent: percent,
      room_fee_refunded: roomRefund,
      enrolments_cancelled: summary.enrolments,
      seat_fees_refunded: summary.seatsRefunded
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not cancel the session' });
  }
});

export default router;

router.post('/:id/book', requireSession, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(404).json({ error: 'no such session' });
      return;
    }
    const personId = res.locals.personId;

    const result = await withTransaction(async (client) => {
      const sessions = await client.query('select * from session where id = $1 for update', [id]);
      if (sessions.rowCount === 0) throw new Error('NOT_FOUND');
      const session = sessions.rows[0];

      if (session.status === 'cancelled') throw new Error('CANCELLED');
      if (session.coach_id === personId) throw new Error('COACH_CANNOT_ENROL');

      const rooms = await client.query('select capacity from room where id = $1', [session.room_id]);
      const roomCapacity = rooms.rows[0].capacity;

      const enrolments = await client.query("select id, person_id from enrolment where session_id = $1 and status = 'active'", [id]);

      if (enrolments.rows.some(e => e.person_id === personId)) {
        throw new Error('ALREADY_ENROLLED');
      }

      if (enrolments.rows.length >= roomCapacity) {
        throw new Error('FULL');
      }

      const seatFeeVal = Number(session.seat_fee_credits);

      const updatedPerson = await client.query(
        'update person set credits = credits - $1 where id = $2 and credits >= $1 returning id',
        [seatFeeVal, personId]
      );

      if (updatedPerson.rowCount === 0) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const inserted = await client.query(
        `insert into enrolment (session_id, person_id, credits_charged, enrolled_at)
         values ($1, $2, $3, now()) returning *`,
        [id, personId, seatFeeVal]
      );

      const hostCoach = await client.query("select email from person where id = $1", [session.coach_id]);
      const participantPerson = await client.query("select email from person where id = $1", [personId]);

      return { enrolment: inserted.rows[0], hostEmail: hostCoach.rows[0]?.email, participantEmail: participantPerson.rows[0]?.email };
    });

    if (result.hostEmail) {
      await sendEmail({
        to: result.hostEmail,
        subject: 'New Booking',
        text: `A new participant has booked your session ${id}.`
      });
    }
    if (result.participantEmail) {
      await sendEmail({
        to: result.participantEmail,
        subject: 'Booking Confirmation',
        text: `Your booking for session ${id} is confirmed.`
      });
    }

    res.status(201).json(result.enrolment);
  } catch (err: any) {
    console.error(err);
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'no such session' });
    if (err.message === 'CANCELLED') return res.status(400).json({ error: 'session is cancelled' });
    if (err.message === 'COACH_CANNOT_ENROL') return res.status(400).json({ error: 'coach cannot enrol in their own session' });
    if (err.message === 'ALREADY_ENROLLED') return res.status(400).json({ error: 'already enrolled' });
    if (err.message === 'FULL') return res.status(409).json({ error: 'session is full' });
    if (err.message === 'INSUFFICIENT_CREDITS') return res.status(400).json({ error: 'insufficient credits' });

    res.status(500).json({ error: 'could not book the session' });
  }
});
