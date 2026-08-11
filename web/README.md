# <span style="color: orange;">Atrium Coaching Centre</span>

## <span style="color: cyan;">1. Setup & Run Instructions</span>

The following steps assume a clean environment containing only **Node.js** and **PostgreSQL**. 

### Prerequisites
*   Node.js (v18 or higher recommended)
*   PostgreSQL running locally on port `5432`
*   [Mailpit](https://github.com/axllent/mailpit) (A zero-install local SMTP catch-all for testing email)

### Step 1: Clone and Navigate
Clone this repository and navigate into the root directory:
```bash
git clone <your-repository-url>
cd Atrium-Coaching-Centre
```

### Step 2: Environment Configuration
Copy the provided example environment file. No real credentials are required.

```bash
cp env.example .env
```
Open `.env` and verify the following variables:

*   `DATABASE_URL`: Update the default string to point to your local PostgreSQL instance (e.g., `postgresql://postgres:password@localhost:5432/atrium`).
*   `SMTP_HOST` and `SMTP_PORT`: Leave as `localhost` and `1025` to route emails to Mailpit.
*   `AI_MODEL_URL` and `AI_MODEL_NAME`: Set to your deterministic stub or local/hosted AI provider details.

### Step 3: Install Dependencies
Install all required packages at the root level (this covers both the `api` and `web` directories):

```bash
npm install
```

### Step 4: Database Setup & Seeding
The Prisma schema and migrations are located in the root directory. Run the following commands to construct the schema and populate the database with the required historical seed data:

```bash
npx prisma migrate dev
npx prisma db seed
```
*(Note: The seed script automatically handles the required timezone conversions for the daylight-saving historical data).*

### Step 5: Start Local Email Transport
To verify the email notification system (cancellations, daily digests, etc.), start Mailpit in a separate terminal window:

```bash
mailpit
```
Mailpit runs silently in the background. You can view all intercepted outgoing emails without any credentials by opening its web interface at `http://localhost:8025`.

### Step 6: Start the Application Servers
This repository separates the Node/Express backend and the Next.js frontend. You must start both development servers.

**Start the Node/Express API:**  
Open a new terminal window, ensure you are in the root directory, and run:

```bash
cd api
npm run dev
```

**Start the Next.js Frontend:**  
Open another terminal window from the root directory and run:

```bash
cd web
npm run dev
```

### Step 7: Access the System
With the database, Mailpit, the backend API, and the frontend all running, the unified login system is now active. Access the system at:

*   **Web Interface (Unified Login):** `http://localhost:3000`

*   **Mailpit Inbox:** `http://localhost:8025`

*   **Backend API URL:** `http://localhost:4000`

## <span style="color: cyan;">2. Defects Found & Fixed</span>

The starter repository contained several intentional performance bottlenecks, data integrity flaws, and security gaps. These were audited, fixed via Prisma/SQL migrations, and secured at the application layer.

### Defect A: Missing Foreign Key Indexes (Performance)
*   **Root Cause:** The `session` table lacked indexes on `coach_id` and `room_id`, and `enrolment` lacked an index on `session_id`. Because PostgreSQL does not automatically index foreign keys, relational lookups forced costly sequential scans across the entire table.
*   **Fix:** Added explicit B-Tree indexes to all foreign key columns.
*   **Performance Impact (`EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM session WHERE coach_id = 19;`):**
    *   **Before Fix (Sequential Scan):**
        ```text
        Seq Scan on session  (cost=0.00..18.25 rows=12 width=152) (actual time=0.015..0.042 rows=12 loops=1)
          Buffers: shared hit=4
        Planning Time: 0.082 ms
        Execution Time: 0.065 ms
        ```
    *   **After Fix (Index Scan):**
        ```text
        Bitmap Heap Scan on session  (cost=4.20..14.35 rows=12 width=152) (actual time=0.012..0.018 rows=12 loops=1)
          Recheck Cond: (coach_id = 19)
          Buffers: shared hit=2
          ->  Bitmap Index Scan on idx_session_coach_id  (cost=0.00..4.17 rows=12 width=0) (actual time=0.008..0.008 rows=12 loops=1)
                Index Cond: (coach_id = 19)
                Buffers: shared hit=1
        Planning Time: 0.124 ms
        Execution Time: 0.034 ms
        ```

### Defect B: Invalid Credit Data Type & Missing Financial Constraints
*   **Root Cause:** The `person.credits` and session fee columns were typed as `numeric(10,2)` despite requirements mandating credits must always be whole integers. Additionally, no schema constraints prevented negative credit balances.
*   **Fix:** Converted fields to strict `INTEGER` types and added a database `CHECK (credits >= 0)` constraint to prevent race-condition overdrafts.

### Defect C: Unenforced Room Exclusivity
*   **Root Cause:** The system relied entirely on application-level checks to prevent double-booking a room, leaving it vulnerable to race conditions under concurrent network requests.
*   **Fix:** Implemented a PostgreSQL GiST exclusion constraint at the schema level:
    ```sql
    ALTER TABLE session ADD CONSTRAINT room_time_excl 
    EXCLUDE USING gist (room_id WITH =, tsrange(starts_at, ends_at) WITH &&);
    ```

### Defect D: Invalid Seed Data Artifacts
*   **Root Cause:** The starter seed script contained legacy strings, case-mismatched enums, and orphaned relation IDs.
*   **Fix:** Cleaned the seed payloads and enforced strict lowercase database ENUM validations for session status types.

### Defect E: Obsolete Password Hashing (`auth.ts`)
*   **Root Cause:** Passwords were processed using an unsalted `crypto.createHash('sha256')`, violating the mandatory requirement for a modern, slow adaptive hashing algorithm.
*   **Fix:** Replaced the hashing module with a secure iterative algorithm featuring randomized salting and work factors.

### Defect F: Flawed Time-Notice Calculation (`credits.ts`)
*   **Root Cause:** The refund notice function used `Math.abs()`, which incorrectly inverted negative time deltas into positive values for post-start cancellations.
*   **Fix:** Removed absolute value logic and instituted strict chronological boundaries where late or post-start cancellations yield 0% notice.

### Defect G: Missing Balance Validation on Creation (`sessions.ts`)
*   **Root Cause:** Coaches could schedule sessions and trigger room fee deductions without verifying whether their account balance was sufficient.
*   **Fix:** Added an explicit application-level check (`if (coach.credits < fee)`) returning a `400 Bad Request` before initiating the transaction.

### Defect H: Missing Clash Validation on Updates (`sessions.ts`)
*   **Root Cause:** While session *creation* verified room availability, the `PATCH` route allowed moving sessions or altering rooms without checking for temporal overlaps.
*   **Fix:** Extended the room clash validation query to safely intercept and reject overlapping modifications during update flows.

## <span style="color: cyan;">3. Credit & Fee Schedule</span>

The fee schedule scales linearly with the active teaching duration of the session, maintaining a strict 2:1 ratio between the Coach's room fee and the Participant's seat fee. 

**Account Issuance (Per Requirements):**
*   **Participants:** 4,000 credits
*   **Coaches:** 2,000 credits

**Session Pricing:**

*   **Short (45 minutes)**
    *   Coach Room Fee: **30 credits**
    *   Participant Seat Fee: **15 credits**
*   **Standard (60 minutes)**
    *   Coach Room Fee: **40 credits**
    *   Participant Seat Fee: **20 credits**
*   **Intensive (180 mins teaching / 210 mins room hold)**
    *   Coach Room Fee: **120 credits** 
    *   Participant Seat Fee: **60 credits**

**Scaling Logic:** 
Fees are calculated mathematically against the `Standard` 60-minute baseline (40 credits for a room). A 45-minute `Short` session is precisely 75% of the standard cost. An `Intensive` session strictly bills for the 180 minutes of active teaching time (3x the standard rate), treating the mandatory 30-minute lunch interval as an unbilled hold.

## <span style="color: cyan;">4. Participant Cancellation Policy</span>

### Participant-Initiated Cancellations
Refunds are calculated based on the absolute hours between cancellation and the session start time:

*   **48+ hours notice:** 100% refund
*   **24 to <48 hours notice:** 50% refund
*   **<24 hours notice:** 0% refund

**Justification:** This offers participants more flexibility than the strict 96-hour coach deadline, while still guaranteeing coaches a 48-hour window to re-fill seats and protecting them from last-minute vacancies.

### Coach-Initiated Cancellations
If a coach cancels a session, enrolled participants receive an immediate **100% refund**. 

**Justification:** Participants bear no financial penalty when they are not at fault, regardless of how close to the start time the cancellation occurs.

### Fractional Rounding
Partial refunds (e.g., 50% of a 15-credit *Short* session = 7.5) are rounded **up (ceiling)** to the nearest whole integer (8 credits). 

**Justification:** Because the database enforces integer-only credits, rounding up acts as a customer-friendly gesture that reduces friction during penalized cancellations.

## <span style="color: cyan;">5. System Invariants</span>

### Enforced in the Schema (PostgreSQL)
1. **Non-Negative Credit Balances:** `CHECK (balance >= 0)`
   * *Why:* Protects against race conditions (e.g., concurrent network requests) that could bypass application logic and overdraft an account.
2. **No Overlapping Room Bookings:** `EXCLUDE USING gist` on `room_id` and the `tsrange(starts_at, ends_at)`.
   * *Why:* Guarantees physical room exclusivity. Application-level checks (`SELECT` then `INSERT`) are vulnerable to race conditions if two bookings arrive at the exact same millisecond.

### Enforced in Application Code (Node/Express API)
1. **Coaches Cannot Book Their Own Sessions:** Validated in the API route.
   * *Why:* Simple business logic. Handling this in code allows us to instantly return a clean, user-friendly `400 Bad Request` without writing complex database triggers.
2. **The INTENSIVE Lunch Interval Rule:** Validated in the scheduling service.
   * *Why:* Extracting a specific 30-minute unbilled block from the middle of a 210-minute session to cross-reference against other bookings is highly domain-specific. This logic is much easier to read, test, and maintain in TypeScript than inside complex SQL constraints.

## <span style="color: cyan;">6. Database Isolation Levels</span>

**Isolation Level Used:** `Read Committed` (PostgreSQL / Prisma Default)  
**Write Paths:** Used across all transactional write paths, including Coach room bookings, Participant seat bookings, and all cancellation/refund flows.

### Unprevented Anomalies
Running under `Read Committed` does **not** prevent the following anomalies:
1.  **Non-Repeatable Reads:** A transaction re-reading data might see different values if a concurrent transaction commits an update in between reads.
2.  **Serialization Anomalies (Write Skew):** Concurrent transactions could theoretically read the same state (e.g., a room appearing empty or a balance appearing sufficient) and execute overlapping inserts/updates that violate business logic.

**Mitigation Strategy:**  
Instead of upgrading the entire database to the slow `Serializable` isolation level (which requires complex retry logic for transaction failures), we mitigated these anomalies at the schema level. Even if Write Skew occurs during a concurrent booking, the PostgreSQL `EXCLUDE` constraint will physically reject the overlapping room, and the `CHECK (credits >= 0)` constraint will physically reject the overdraft, ensuring data integrity without sacrificing performance.

## <span style="color: cyan;">7. Assumptions Made</span>

**1. The `INTENSIVE` Session Lunch Timing**
* **Ambiguity:** The exact placement of the 30-minute lunch break within the 210-minute `INTENSIVE` session block is not specified.
* **Assumption:** The break occurs exactly in the middle (90 mins teaching → 30 mins lunch → 90 mins teaching).
* **If wrong:** If coaches are allowed to dynamically choose when their break happens, the scheduling validation will incorrectly flag or miss double-booking conflicts.

**2. Server Timezone vs. Centre Time**
* **Ambiguity:** How the server environment handles the required `America/New_York` local time for scheduled jobs.
* **Assumption:** The server and database operate strictly in UTC. Cron jobs use timezone-aware scheduling to dynamically calculate 00:00 `America/New_York`, automatically handling DST shifts.
* **If wrong:** If the deployed server natively runs on `America/New_York` time, applying manual timezone offsets in the code would cause scheduled jobs to fire at the wrong hour.

**3. AI Assistant Context Validation**
* **Ambiguity:** How the AI securely determines who it is talking to "from the session".
* **Assumption:** The backend securely extracts the user's role and ID directly from the HTTP session/cookie, strictly ignoring any identity claims sent from the frontend payload.
* **If wrong:** If the API relied on the client to declare its own role in the request body, a malicious user could easily alter the request to claim "administrator" privileges and steal data.

## <span style="color: cyan;">8. Unfinished Work</span>

* **Scheduled Daily Digest Emails:** While the event-driven emails (cancellations and bookings) are fully implemented and viewable via Mailpit, the automated cron jobs for the 00:00 `America/New_York` daily digests are incomplete.
* **Anonymous AI Bookings:** The AI assistant correctly handles context-aware queries for logged-in participants, coaches, and administrators. However, the flow for an anonymous visitor to book a session and securely generate a new account entirely via the chat interface is not fully implemented.

**Why I stopped here:**
With the deadline approaching, I chose to prioritize the stability and security of the core architecture. I focused my time on ensuring the booking math, strict role-based data isolation, unified login, and database invariants were 100% reliable. I opted to submit a secure, functioning core product on time rather than risking the submission on complex LLM account-generation flows or edge-case timezone cron logic.