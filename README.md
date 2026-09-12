# EduResult

Multi-tenant school assessment and result management system built with the MERN stack.

## Run locally

1. Copy `server/.env.example` to `server/.env`.
2. Add your MongoDB connection string and JWT secret.
3. Run `npm install` from the project root (this installs `concurrently`).
4. Run `npm run install:all` to install the client and server packages.
5. Run `npm run seed --prefix server` to create the sample school and accounts.
6. Run `npm run dev`.

The client opens at `http://localhost:5173` and the API runs at `http://localhost:5000`.

Demo accounts are created by `npm run seed --prefix server`.

## Demo accounts

All seeded accounts use the password `password123`.

- Admin: `admin@brightfuture.edu`
- Teacher: `teacher@brightfuture.edu`
- Form Master: `formmaster@brightfuture.edu`

Teachers only receive API access to assigned classes and subjects. Form Masters can review only their assigned class, while Admins retain school-wide control and audited result reopening.

The dashboard, result progress, activity feed, directories and report cards use live MongoDB data. Admins can generate a one-time temporary password for a teacher from the Teachers page when an account password is forgotten.

## Echo8V platform owner

The private platform dashboard is available at `/echo8v-control-portal`. Before using it, add `PLATFORM_ADMIN_NAME`, `PLATFORM_ADMIN_USERNAME` and `PLATFORM_ADMIN_PASSWORD` to `server/.env`, then run `npm run seed:platform-admin --prefix server` once. The owner can create schools and their first School Admin, edit pricing and school details, suspend/reactivate access, and archive schools without deleting academic records.
