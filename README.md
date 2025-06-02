# 📄 Job URL Deduplication & Cleaner App

A web-based tool for cleaning and deduplicating job application URLs with profile-based organization.

## ✨ Features

- **URL Processing**: Clean URLs by removing tracking parameters and normalize format
- **Profile Management**: Organize URLs under profile names (groups)
- **Duplicate Detection**: Identify duplicates within the same profile
- **Filtering & Sorting**: Filter by domain, duplicate status; sort by various criteria
- **Export Options**: Export to CSV or copy cleaned URLs to clipboard
- **File Upload**: Support for plain text and OneTab exported files

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Express + TypeScript + PostgreSQL
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd url-cleaner-app
```

2. Install dependencies
```bash
npm run install:all
```

3. Set up environment variables
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Configure your PostgreSQL database URL in `backend/.env`

5. Run database migrations
```bash
cd backend
npx prisma migrate dev
```

6. Start development servers
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📁 Project Structure

```
url-cleaner-app/
├── frontend/          # React frontend
├── backend/           # Express backend
├── package.json       # Root package.json
└── README.md
```

## 📝 API Endpoints

- `GET /api/profiles` - Get all profiles
- `POST /api/profiles` - Create new profile
- `POST /api/urls/process` - Process and clean URLs
- `GET /api/urls/:profileId` - Get URLs for a profile
- `GET /api/urls/:profileId/export` - Export URLs as CSV

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request 