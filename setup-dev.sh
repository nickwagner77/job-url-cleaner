#!/bin/bash

echo "🚀 Setting up Job URL Cleaner development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing backend dependencies..."
cd backend && npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

echo "🔧 Generating Prisma client..."
cd ../backend && npx prisma generate

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please update the DATABASE_URL in backend/.env with your PostgreSQL connection string"
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up a PostgreSQL database"
echo "2. Update DATABASE_URL in backend/.env"
echo "3. Run 'cd backend && npx prisma migrate dev' to create database tables"
echo "4. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "🌐 The app will be available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001" 