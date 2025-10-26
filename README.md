# Highview Student Management System

A comprehensive student attendance and engagement tracking system built with Next.js 14, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### 1. Create Environment File

Create `.env.local` in the project root:

```env
DB_HOST=database-1-instance-1.cziyo8qqeu6x.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=AWSINRIX123
```

### 2. Run Database Migration

**This creates all database tables (run once):**

```bash
npm run migrate
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## ✨ Features

- 📊 **Dashboard** - View statistics and top performers
- 👥 **Student Management** - Add, import from CSV, manage students
- 📅 **Session Management** - Create sessions and track attendance
- ⭐ **Points System** - Award 0, 2.5, or 5 points based on engagement
- 🏆 **Extra Points** - Award bonus points for achievements
- 📈 **Leaderboard** - Real-time rankings and statistics

## 📖 Documentation

- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Database setup instructions
- **[SETUP.md](SETUP.md)** - Complete feature guide and usage
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Detailed project documentation

## 🎯 Quick Usage

### Import Sample Students

1. Go to `/students`
2. Click "Import CSV"
3. Upload `sample-students.csv`

### Create a Session

1. Go to `/sessions`
2. Click "Add Session"
3. Enter name and date

### Mark Attendance

1. Go to `/sessions`
2. Click "Attendance" on any session
3. Select points for each student:
   - **0** = Absent
   - **2.5** = Present
   - **5** = Engaged

## 📦 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── students/page.tsx     # Student management
│   ├── sessions/page.tsx     # Session & attendance
│   └── layout.tsx            # Root layout
├── components/
│   ├── sidebar.tsx           # Navigation
│   └── ui/                   # UI components
└── lib/
    ├── db.ts                 # Database connection
    ├── types.ts              # TypeScript types
    └── actions.ts            # Server actions
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Amazon RDS)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run lint` - Run ESLint

## 🗄️ Database Schema

- **students** - Student profiles
- **sessions** - Session information
- **session_attendance** - Attendance tracking with points
- **extra_points** - Additional points from other sources

All tables have proper indexes, foreign keys, and constraints.

## 🔒 Security

- Database credentials in `.env.local` (gitignored)
- SSL connection to RDS
- Server-side validation
- Type-safe operations

## 🐛 Troubleshooting

### "relation does not exist" error?
Run the migration script: `npm run migrate`

### Can't connect to database?
- Check `.env.local` has correct credentials
- Verify RDS security group allows your IP
- Confirm RDS instance is running

### Need to reset database?
See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md#need-to-reset)

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🎉 You're Ready!

After running the migration, your database is set up and you can start tracking student attendance!

For detailed usage instructions, see [SETUP.md](SETUP.md).
