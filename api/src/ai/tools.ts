import crypto from 'node:crypto';
import { query, withTransaction } from '../db';
import { sendEmail } from '../email';
import { UserContext } from './context';

/**
 * Executes a tool query strictly filtered by the user's role and identity.
 */
export async function executeAssistantTool(toolName: string, args: any, context: UserContext): Promise<any> {
    const { role, personId } = context;

    switch (toolName) {
        // 1. Catalogue / Available Sessions (Accessible to EVERYONE, including anonymous)
        case 'get_available_sessions': {
            const result = await query(`
        select s.id, s.discipline, s.session_type, s.starts_at, s.ends_at,
               r.name as room_name, r.capacity,
               p.full_name as coach_name,
               (r.capacity - (select count(*) from enrolment e where e.session_id = s.id and e.status = 'active')) as places_remaining
          from session s
          join room r on r.id = s.room_id
          join person p on p.id = s.coach_id
         where lower(s.status) in ('scheduled', 'confirmed')
           and s.starts_at > now()
         order by s.starts_at asc
         limit 20
      `);
            return result;
        }

        // 2. Participant Bookings (Strictly restricted to the logged-in participant)
        case 'get_participant_bookings': {
            if (role !== 'participant' && role !== 'coach') {
                throw new Error('Unauthorized: You must be logged in as a participant to view your bookings.');
            }

            const result = await query(`
        select e.id as enrolment_id, e.status as enrolment_status, e.credits_charged,
               s.id as session_id, s.discipline, s.session_type, s.starts_at, s.ends_at,
               r.name as room_name, p.full_name as coach_name
          from enrolment e
          join session s on s.id = e.session_id
          join room r on r.id = s.room_id
          join person p on p.id = s.coach_id
         where e.person_id = $1
         order by s.starts_at desc
      `, [personId]);
            return result;
        }

        // 3. Coach Sessions (Strictly restricted to the logged-in coach seeing their own sessions)
        case 'get_coach_sessions': {
            if (role !== 'coach' && role !== 'admin') {
                throw new Error('Unauthorized: Access restricted to coaches.');
            }

            // If they are a coach, force filter by their personId. If admin, they can see all or specific coach.
            const targetCoachId = role === 'admin' ? (args.coachId || personId) : personId;

            const result = await query(`
        select s.id as session_id, s.discipline, s.session_type, s.status, s.starts_at, s.ends_at,
               r.name as room_name,
               (select count(*) from enrolment e where e.session_id = s.id and e.status = 'active') as active_enrolments
          from session s
          join room r on r.id = s.room_id
         where s.coach_id = $1
         order by s.starts_at desc
      `, [targetCoachId]);
            return result;
        }

        // 4. Admin Master Data (Strictly restricted to admins)
        case 'get_admin_system_overview': {
            if (role !== 'admin') {
                throw new Error('Unauthorized: Administrator access required.');
            }

            const sessions = await query('select count(*) as total_sessions from session');
            const users = await query('select kind, count(*) as count from person group by kind');
            const totalCredits = await query('select sum(credits) as aggregate_credits from person');

            return {
                totalSessions: sessions[0]?.total_sessions || 0,
                usersByType: users,
                systemCreditEconomy: totalCredits[0]?.aggregate_credits || 0
            };
        }

        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}

/**
 * Handles booking requests for anonymous visitors, creating an account if necessary.
 */
export async function handle_visitor_booking(email: string, sessionId: number): Promise<any> {
    return await withTransaction(async (client) => {
        // 1. Verify session exists and get seat_fee
        const sessionRes = await client.query('select seat_fee_credits from session where id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) {
            throw new Error(`Session ${sessionId} not found.`);
        }
        const seatFee = sessionRes.rows[0].seat_fee_credits;

        // 2. Check if person exists
        const personRes = await client.query('select id from person where email = $1', [email]);
        let personId: number;
        let isNewUser = false;

        if (personRes.rows.length > 0) {
            personId = personRes.rows[0].id;
        } else {
            // 3. Create new user
            isNewUser = true;
            const insertPerson = await client.query(`
                insert into person (email, full_name, kind, password_hash, credits, active, created_at)
                values ($1, 'Visitor', 'participant', '', 0, true, now())
                returning id
            `, [email]);
            personId = insertPerson.rows[0].id;

            // Generate password setup flow token
            const setupToken = crypto.randomBytes(32).toString('hex');
            const setupUrl = `http://localhost:3000/setup-password?token=${setupToken}`;

            // Send Email
            await sendEmail({
                to: email,
                subject: 'Welcome to Atrium - Secure Password Setup',
                text: `Hello! You have been enrolled in a session. Please set up your password here: ${setupUrl}`
            });
        }

        // 4. Create Enrolment
        await client.query(`
            insert into enrolment (session_id, person_id, status, credits_charged, enrolled_at)
            values ($1, $2, 'active', $3, now())
        `, [sessionId, personId, seatFee]);

        return {
            status: 'success',
            message: isNewUser 
                ? 'Account created successfully, secure password setup emailed, and session booked.'
                : 'Session booked successfully for existing user.',
            email,
            sessionId,
            isNewUser
        };
    });
}