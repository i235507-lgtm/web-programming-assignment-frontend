# Handwritten Answers — Expense Management with Ranking System
**Print this document and write/copy answers onto your answer sheet.**

---

## Q1. System Flow Diagram (2 marks)

Draw and label the following flow:

```
[User Browser]
     |
     | HTTP Request (with JWT in header)
     v
[React Frontend — Vercel]
     |
     | axios.post / axios.get to API URL
     v
[Express Backend — Render]
     |
     | 1. auth middleware → verify JWT
     | 2. validate middleware → check input
     | 3. Route handler → call Mongoose
     v
[MongoDB Atlas — Cloud]
     |
     | Returns document(s)
     v
[Express] → JSON Response (200/201/4xx)
     |
     v
[React] → setState() → Re-render UI
```

**Label each layer:**
- Frontend: React + React Router (Vercel)
- Backend: Node.js + Express (Render)
- Database: MongoDB Atlas (Cloud Cluster)
- Auth: JWT Bearer Token in every protected request

---

## Q2. One API Route — Step by Step (2 marks)

**Route: POST /api/expenses (Add a new expense)**

Step 1 — Client sends POST request to `/api/expenses` with body:
```json
{ "title": "Lunch", "amount": 350, "category": "Food" }
```
Authorization header: `Bearer <jwt_token>`

Step 2 — `auth` middleware runs first.
It reads `req.headers.authorization`, splits on `Bearer `, extracts the token, and calls `jwt.verify(token, JWT_SECRET)`.
If valid, it attaches `req.userId = decoded.userId` and calls `next()`.
If invalid, returns `401 INVALID_TOKEN`.

Step 3 — `express-validator` rules run (array of `body()` validators).
Checks: `title` not empty, `amount` is a float >= 0.01, `category` is in the allowed enum list.
If validation fails, `validate` middleware returns `422 VALIDATION_ERROR` with field-level details.

Step 4 — Route handler executes.
Creates a new Mongoose document: `Expense.create({ userId: req.userId, title, amount, category, date, description })`.
Mongoose runs schema validation, then inserts into MongoDB Atlas.

Step 5 — On success, returns `201 Created` with the created expense document as JSON.
On any unhandled error, Express global error handler returns `500 INTERNAL_ERROR`.

---

## Q3. Database Relationship (2 marks)

**Two collections: `users` and `expenses`**

**Relationship type:** One-to-Many — one user has many expenses.

**Choice: Referencing (not embedding)**

The `expenses` collection stores a `userId` field of type `ObjectId` that points to the `_id` of a document in the `users` collection. This is referencing.

**Why referencing over embedding:**

I chose referencing because a single user can accumulate thousands of expenses over time. If I embedded expenses as an array inside the user document, that document would grow without bound and eventually exceed MongoDB's 16MB document size limit. Additionally, every query that reads expenses (filtering by category, sorting by amount, running aggregations) would be forced to load the entire user document including all embedded expenses, which is wasteful.

With referencing, expenses are a separate collection queried directly with `{ userId: req.userId }`, keeping each document small and queries efficient.

---

## Q4. Core FinTech Logic — Ranking System (2 marks)

**How the system ranks expense categories:**

The ranking logic lives in `GET /api/expenses/rankings` in the backend.

**Example trace:**

User has these expenses for the month:
- Food: PKR 500, PKR 800 → total PKR 1,300
- Transport: PKR 400, PKR 600 → total PKR 1,000
- Housing: PKR 15,000 → total PKR 15,000

**Step 1 — Filter:** MongoDB `$match` stage selects only this user's expenses within the chosen time period.

**Step 2 — Group:** `$group` by `category`, summing the `amount` field for each group.
Result: `{ Food: 1300, Transport: 1000, Housing: 15000 }`

**Step 3 — Sort:** `$sort: { totalAmount: -1 }` orders groups from highest to lowest.
Order becomes: Housing (15000) → Food (1300) → Transport (1000)

**Step 4 — Assign Ranks:** JavaScript `.map((item, index) => ({ rank: index + 1, ... }))` adds rank numbers.
Housing = Rank 1, Food = Rank 2, Transport = Rank 3.

**Step 5 — Percentage:** Each category's total is divided by the grand total (17,300) and multiplied by 100.
Housing = 86.7%, Food = 7.5%, Transport = 5.8%

The frontend displays these as color-coded rank cards with progress bars showing the percentage visually.

---

## Q5. Real Security Flaw (2 marks)

**Vulnerability: Missing rate limiting on the login endpoint**

**Location:** `POST /api/auth/login`

**The flaw:** There is no rate limiting on the login route. An attacker can send thousands of login requests per second with different passwords, attempting to brute-force a user's password. Since the endpoint returns different responses for "wrong email" vs "wrong password" style errors, an attacker can also enumerate valid email addresses.

**Example attack:**
```
POST /api/auth/login { email: "victim@email.com", password: "password1" } → 401
POST /api/auth/login { email: "victim@email.com", password: "password2" } → 401
POST /api/auth/login { email: "victim@email.com", password: "password3" } → 200 (found it)
```
With 1,000 requests/second this takes seconds against a weak password.

**The fix:** Add `express-rate-limit` middleware specifically on auth routes:
```javascript
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // max 10 attempts per IP
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again in 15 minutes.' } }
});
router.post('/login', loginLimiter, [...validators], validate, handler);
```
This limits each IP to 10 login attempts per 15 minutes, making brute force attacks impractical.
