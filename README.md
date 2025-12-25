# Costally - Personal Finance Tracker

<p align="center">
  <img src="public/logo.png" alt="Costally Logo" width="150">
</p>

**An intelligent personal finance platform featuring AI-powered budget assistance, automated expense tracking, and real-time financial insights.**

🔗 **Live Demo:** [costally.vercel.app](https://costally.vercel.app)

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)

---

## Features

### **Financial Management**
- Track income from multiple sources
- Monitor expenses by category
- Set and manage monthly budgets
- Real-time budget progress tracking
- Category-based spending analysis

### **AI-Powered Assistant**
- Google Gemini AI chatbot for personalized financial advice
- Real-time spending pattern analysis
- Budget recommendations based on your data
- Natural language queries about your finances

### **Dashboard & Analytics**
- Interactive financial dashboard
- Visual spending breakdowns by category
- Monthly income vs expenses comparison

### **Transaction Management**
- Add, edit, and delete transactions
- Recurring transaction support
- Multiple frequency options (daily, weekly, monthly)
- Transaction categorization
- Search and filter capabilities

---

## Tech Stack

### **Frontend**
- **React Router v7** - Full-stack React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icon library

### **Backend**
- **Node.js** - JavaScript runtime
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Relational database
- **Vite** - Build tool and dev server

### **AI Integration**
- **Google Gemini AI** - Generative AI for chatbot
- **@google/generative-ai** - Official Gemini SDK

### **Deployment**
- **Vercel** - Platform for deployment

---

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/DianaWijaya/budget-planner-project.git
cd budget-planner-project
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure your `.env` file**

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/costally"

# Google Gemini AI
GEMINI_API_KEY="your_gemini_api_key_here"

# Session Secret (generate a random string)
SESSION_SECRET="your_random_session_secret_here"
```

### How to Get API Keys:

**Google Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in `.env`

**PostgreSQL Database:**
- **Local:** Install PostgreSQL locally
- **Cloud:** Use [Supabase](https://supabase.com/) or [Railway](https://railway.app/) (free tier available)

---

## Database Setup

1. **Run Prisma migrations**
```bash
npx prisma migrate dev
```

2. **Generate Prisma Client**
```bash
npx prisma generate
```

3. **Seed the database (optional)**
```bash
npx prisma db seed
```

4. **View your database in Prisma Studio**
```bash
npx prisma studio
```

### Database Schema

The application uses the following models:
- **User** - User accounts and authentication
- **Budget** - Monthly budget allocations
- **Transaction** - Expense tracking with categories
- **Income** - Income source tracking

---

## Running the Application

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```