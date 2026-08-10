import cron from 'node-cron';
import { DateTime } from 'luxon';
import { query } from './db';
import { sendEmail } from './email';

export function startCronJobs() {
  console.log('[CRON] Initializing timezone-aware scheduled jobs (America/New_York)');

  // Job 1: Coach Daily Summary
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = DateTime.now().setZone('America/New_York');
      const startOfDay = now.startOf('day');
      const endOfDay = startOfDay.plus({ days: 1 });

      const startUtc = startOfDay.toUTC().toISO();
      const endUtc = endOfDay.toUTC().toISO();

      const sessions = await query(
        `select s.id, s.starts_at, s.discipline, s.session_type, r.name as room_name, p.id as coach_id, p.full_name as coach_name, p.email as coach_email
           from session s
           join person p on p.id = s.coach_id
           join room r on r.id = s.room_id
          where lower(s.status) in ('scheduled', 'confirmed')
            and s.starts_at >= $1 and s.starts_at < $2
          order by s.coach_id, s.starts_at`,
        [startUtc, endUtc]
      );

      const byCoach: Record<string, any[]> = {};
      for (const s of sessions) {
        const cId = String(s.coach_id);
        if (!byCoach[cId]) byCoach[cId] = [];
        byCoach[cId].push(s);
      }

      for (const coachSessions of Object.values(byCoach)) {
        if (coachSessions.length === 0) continue;
        
        const coachName = coachSessions[0].coach_name;
        const email = coachSessions[0].coach_email;
        let text = `Hello ${coachName},\n\nHere is your daily summary for ${startOfDay.toISODate()}:\n\n`;
        for (const s of coachSessions) {
           text += `- ${new Date(s.starts_at).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}: ${s.discipline} (${s.session_type}) in ${s.room_name}\n`;
        }
        
        await sendEmail({
          to: email,
          subject: `Daily Schedule for ${startOfDay.toISODate()}`,
          text
        });
      }

    } catch (err) {
      console.error('[CRON Coach Summary] error:', err);
    }
  }, {
    timezone: 'America/New_York'
  });

  // Job 2: Administrator Daily Digest
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = DateTime.now().setZone('America/New_York');
      const startOfDay = now.startOf('day');
      const endOfDay = startOfDay.plus({ days: 1 });

      const startUtc = startOfDay.toUTC().toISO();
      const endUtc = endOfDay.toUTC().toISO();

      const sessions = await query(
        `select s.id, s.starts_at, s.discipline, r.name as room_name, p.full_name as coach_name,
                (select count(*) from enrolment e where e.session_id = s.id and e.status = 'active') as enrol_count
           from session s
           join person p on p.id = s.coach_id
           join room r on r.id = s.room_id
          where s.starts_at >= $1 and s.starts_at < $2 and s.status <> 'cancelled'
          order by s.starts_at`,
        [startUtc, endUtc]
      );

      const admins = await query("select email from person where kind = 'admin'");
      
      let text = `Daily Digest for ${startOfDay.toISODate()}:\n\nTotal Sessions: ${sessions.length}\n\n`;
      for (const s of sessions) {
         text += `- ${new Date(s.starts_at).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}: ${s.discipline} with ${s.coach_name} in ${s.room_name} (${s.enrol_count} attendees)\n`;
      }

      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `Administrator Daily Digest - ${startOfDay.toISODate()}`,
          text
        });
      }
    } catch (err) {
      console.error('[CRON Admin Digest] error:', err);
    }
  }, {
    timezone: 'America/New_York'
  });
}
