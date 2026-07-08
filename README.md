# 🌿 Ooshma: Net-Zero Habit Log

A full-stack web application that helps users track their carbon footprint, build eco-friendly habits, and work toward a net-zero lifestyle — with an AI assistant, live food scanner, goal tracking, and automated PDF reports.

---

## Features

- **Dashboard** — Live CO₂ stats (today / month / year), category breakdown charts, daily trend, and global comparison
- **Log Activity** — Log transport, energy, food, shopping, and waste activities with automatic CO₂ calculation
- **Goals** — Set monthly or yearly CO₂ reduction goals and track progress with live percentage bars
- **Achievements** — Unlock badges for streaks, logging milestones, and low-impact weeks
- **AI Assistant (Ooshma AI)** — Ask anything about carbon emissions, get instant eco advice, and calculate CO₂ for any activity
- **Food Scanner** — Search food products by name or scan/upload a barcode photo to see CO₂ impact and Nutri-Score
- **Reports** — Download or email a personalized weekly PDF report with your footprint summary and tips
- **Action Center** — Browse curated eco actions to reduce your footprint
- **History** — View, filter, and delete past activity logs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10, Django 4.2, Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | SQLite (dev) |
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS with CSS variables |
| Barcode Scanning | ZXing (camera), Quagga2 (image upload) |
| Food Data | Open Food Facts API |
| PDF Reports | ReportLab |
| Email | Gmail SMTP |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
ooshma-net-zero-habit-log/
├── backend/
│   ├── api/              # Activities, Goals, Streaks, Achievements, Food Scanner, Chat, Reports
│   ├── users/            # Custom user model & auth endpoints
│   ├── core/             # Emission factors, CO2 calculator, AI chat engine, suggestions
│   ├── backend/          # Django settings, URLs, WSGI
│   ├── .env.example      # Environment variable template
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/        # All 9 page components + CSS
│   │   ├── components/   # Layout (sidebar + topbar)
│   │   ├── api/          # Axios instance with JWT interceptor
│   │   └── context/      # AuthContext
│   ├── public/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Getting Started (Local Development)

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

---

### 1. Clone the repository

```bash
git clone https://github.com/mohamedibrahim26/ooshma-net-zero-habit-log.git
cd ooshma-net-zero-habit-log
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux
# Open .env and set USE_SQLITE=True for local dev

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Start the server
python manage.py runserver
```

Backend runs at `http://localhost:8000`

---

### 3. Frontend setup

Open a **new** terminal window:

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`

---

### 4. Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
USE_SQLITE=True

# Gmail (for email reports - optional)
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

> For Gmail, go to Google Account → Security → 2-Step Verification → App Passwords, and generate one for "Mail".

---

## Running with Docker

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register/` | Register a new user |
| POST | `/api/users/login/` | Login and get JWT tokens |
| GET/POST | `/api/activities/` | List or create activity logs |
| GET | `/api/activities/dashboard/` | Dashboard statistics |
| GET/POST | `/api/goals/` | List or create goals |
| GET | `/api/streaks/` | Current streak and achievements |
| POST | `/api/chat/` | AI assistant message |
| GET | `/api/food-scan/` | Food product lookup by name or barcode |
| GET | `/api/report/download/` | Download PDF report |
| POST | `/api/report/send/` | Email PDF report to user |

---

## License

MIT License — free to use, modify, and distribute.

---

Built with love for a greener planet.
