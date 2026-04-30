# Technical Report
## Expense Management System with Ranking Logic
**Course:** Web Programming | **Domain:** Expense Management | **Logic:** Ranking System | **Complexity:** Intermediate

---

## 1. Problem Definition

Managing personal finances is a recurring challenge for individuals. Most people spend without visibility into which categories consume the most money. This system solves that by:

1. Allowing users to log expenses with categories and amounts.
2. Automatically ranking spending categories from highest to lowest total spend.
3. Surfacing the top individual transactions so users know where large single costs occur.

The system targets personal finance users who want actionable insight — not just a list of transactions, but a ranked view that shows exactly where money is going and by how much relative to total spend.

---

## 2. System Architecture

```
[React Frontend]  <-->  [Express REST API]  <-->  [MongoDB Atlas]
     Vercel            Render / Railway           Cloud Cluster
```

**Request Flow:**
1. User interacts with React UI (login, add expense, view rankings).
2. React sends HTTP request to Express API with JWT in Authorization header.
3. Express middleware verifies JWT, validates input, then calls MongoDB via Mongoose.
4. MongoDB returns data; Express sends JSON response.
5. React updates state and re-renders the view.

**MERN Stack Breakdown:**
| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| M | MongoDB Atlas | Persist users and expenses |
| E | Express.js | REST API, routing, middleware |
| R | React + Vite | UI rendering, state, routing |
| N | Node.js | Runtime for Express |

---

## 3. Database Design

### Collections

**Collection 1: `users`**
```
{
  _id: ObjectId,
  name: String (required, max 100),
  email: String (required, unique, lowercase),
  password: String (bcrypt hashed, min 6 chars),
  createdAt: Date,
  updatedAt: Date
}
```

**Collection 2: `expenses`**
```
{
  _id: ObjectId,
  userId: ObjectId → ref: 'User',   // FOREIGN KEY REFERENCE
  title: String (required, max 200),
  amount: Number (required, min 0.01),
  category: String (enum: Food|Transport|Housing|Entertainment|Healthcare|Education|Shopping|Utilities|Other),
  date: Date (required),
  description: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Relationship: Referencing vs Embedding

The `expenses` collection **references** `users` via `userId` (ObjectId foreign key) rather than embedding expenses inside the user document.

**Justification:**
- A user can have hundreds or thousands of expenses. Embedding all of them in a single user document would make the document grow unboundedly, exceeding MongoDB's 16MB document limit at scale.
- Referencing allows expenses to be queried, filtered, sorted, and aggregated independently without loading the entire user object.
- Read patterns almost always query expenses in isolation (filtered by userId), making referencing more efficient.

**Indexes:**
- `{ userId: 1, date: -1 }` — covers date-sorted expense queries
- `{ userId: 1, category: 1 }` — covers category-filtered queries
- `{ userId: 1, amount: -1 }` — covers amount-sorted ranking queries

---

## 4. Core Logic Explanation — Ranking System

The ranking system is the primary intelligence of this application. It determines which spending categories and individual transactions are most significant for a user.

### Step-by-Step Category Ranking

**Input:** User's expenses for a selected time period (all time / month / week / year).

**Step 1 — Filter:** Match only expenses belonging to the authenticated user within the selected date range using `userId` and `date.$gte`.

**Step 2 — Group & Aggregate:** Group all matched expenses by `category`. For each category, compute:
- `totalAmount`: Sum of all expense amounts in that category.
- `count`: Number of transactions.
- `avgAmount`: Average transaction value.
- `maxAmount`: Largest single transaction.

**Step 3 — Sort:** Sort the grouped results by `totalAmount` descending. The category with the most spending comes first.

**Step 4 — Rank:** Assign rank numbers in JavaScript (rank 1 = highest spend, rank 2 = second highest, etc.).

**Step 5 — Percentage:** Calculate each category's `percentage` = (categoryTotal / grandTotal) × 100. This shows relative weight.

**Output:** Ordered list like:
```
Rank 1: Housing — PKR 25,000 (42%)
Rank 2: Food — PKR 18,000 (30%)
Rank 3: Transport — PKR 8,000 (13%)
...
```

### Individual Expense Ranking
Top 10 individual expenses are found by sorting all user expenses by amount descending and taking the first 10 documents. Rank is assigned by position (rank 1 = highest single amount).

---

## 5. Query Explanation

### Query 1 — Category Ranking Aggregation (MongoDB Pipeline)
```javascript
Expense.aggregate([
  { $match: { userId: ObjectId(userId), date: { $gte: startDate } } },
  { $group: {
    _id: '$category',
    totalAmount: { $sum: '$amount' },
    count: { $sum: 1 },
    avgAmount: { $avg: '$amount' },
  }},
  { $sort: { totalAmount: -1 } }
])
```
**Purpose:** Groups all user expenses by category and computes totals. The `$sort` step produces the ranked order. This single pipeline replaces what would be multiple queries and application-side sorting.

**Sample input data:**
```
{ category: "Food", amount: 500 }
{ category: "Food", amount: 300 }
{ category: "Transport", amount: 900 }
```
**Output:**
```
{ _id: "Transport", totalAmount: 900 }  → Rank 1
{ _id: "Food", totalAmount: 800 }       → Rank 2
```

### Query 2 — Top Expenses by Amount (Filtered Sort)
```javascript
Expense.aggregate([
  { $match: { userId: ObjectId(userId) } },
  { $sort: { amount: -1 } },
  { $limit: 10 }
])
```
**Purpose:** Returns the 10 largest individual expenses for a user. Uses the compound index `{ userId: 1, amount: -1 }` for efficient lookup without a full collection scan.

---

## 6. Security Analysis

### Implemented Security Measures

**1. Password Hashing (bcrypt, cost factor 12)**
Passwords are never stored in plaintext. `bcrypt.hash(password, 12)` is called in a Mongoose `pre-save` hook before writing to MongoDB.

**2. JWT Authentication**
All protected routes require a valid `Bearer` token in the `Authorization` header. The `auth` middleware verifies the token using `jsonwebtoken.verify()`. An invalid or expired token returns HTTP 401.

**3. Input Validation (express-validator)**
All API endpoints validate incoming request bodies. `title`, `email`, `password`, `amount`, `category` are validated for type, length, and format before touching the database. Invalid input returns HTTP 422 with field-level error details.

**4. Protected Routes (Frontend + Backend)**
- Frontend: `ProtectedRoute` component redirects unauthenticated users to `/login`.
- Backend: Every `/api/expenses` route applies the `auth` middleware. A user can only read/write/delete their own expenses (`userId: req.userId` filter in every query).

**5. Authorization Scoping**
DELETE `/api/expenses/:id` finds by both `_id` AND `userId`. A user cannot delete another user's expense even if they know the ID.

**6. CORS Configuration**
CORS is configured to only allow requests from the specific `CLIENT_URL` environment variable, not wildcard `*`.

---

## 7. Scalability Discussion

### What would break at 10,000 users?

| Issue | Impact | Fix |
|-------|--------|-----|
| `GET /expenses` returns up to 500 documents per user | Memory spike if many users query simultaneously | Add cursor-based pagination (`?cursor=lastId&limit=20`) |
| Rankings aggregation runs on every request | CPU pressure on MongoDB at scale | Cache ranking results in Redis with a 5-minute TTL, invalidate on new expense |
| No rate limiting on auth endpoints | Brute force login attacks succeed | Add `express-rate-limit` middleware (e.g. 10 requests/minute per IP on `/api/auth`) |
| Single MongoDB connection | Connection pool exhaustion | Use Mongoose connection pooling (`poolSize: 10`) and connection string options |
| JWT tokens never expire early | Compromised tokens remain valid for 7 days | Implement token blacklist or switch to 15-minute access tokens + refresh tokens |
| Expenses collection has no TTL | Storage grows unboundedly | Add data archival job for expenses older than 2 years |

The most critical fix is **rate limiting** on `/api/auth/login` — brute force attacks on password endpoints are the most common real-world attack vector and trivially prevented.
