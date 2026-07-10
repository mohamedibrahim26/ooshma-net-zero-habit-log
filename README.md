# Ooshma: Net-Zero Habit Log

Ooshma is a full-stack web app I built to help people track their carbon footprint and build better habits around sustainability. It includes an AI assistant, a live food barcode scanner, goal tracking, streak rewards, and weekly PDF reports.

**Live Demo:** [ooshma-net-zero-habit-log.vercel.app](https://ooshma-net-zero-habit-log.vercel.app)

---

## What it does

**Dashboard** - Shows your CO2 stats for today, this month, and this year. Includes charts for daily trends, category breakdown, and a comparison against the global average.

**Log Activity** - Log activities across transport, energy, food, shopping, and waste. The app automatically calculates the CO2 emission based on what you entered.

**Goals** - Set a monthly or yearly CO2 reduction target and track your progress with a live percentage bar.

**Achievements** - Earn badges for things like logging streaks, completing 10 or 50 activities, or having a full low-impact week.

**AI Assistant** - Ask the built-in AI anything about carbon emissions or eco habits. It can also estimate CO2 for a specific activity you describe.

**Food Scanner** - Search any food product by name, or scan a barcode using your camera or by uploading a photo. It pulls data from Open Food Facts and shows the CO2 impact per 100g along with the Nutri-Score.

**Reports** - Download your weekly summary as a PDF, or have it emailed directly to you.

**Action Center** - Browse practical actions you can take to lower your footprint.

**History** - View and filter all your past logs, with the option to delete entries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10, Django 4.2, Django REST Framework |
| Auth | JWT via djangorestframework-simplejwt |
| Database | SQLite (local dev) |
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS with CSS variables |
| Barcode Scanning | ZXing for live camera, Quagga2 for uploaded images |
| Food Data | Open Food Facts API |
| PDF Reports | ReportLab |
| Email | Gmail SMTP |
| Containers | Docker + Docker Compose |

---

## Project Structure

```
ooshma-net-zero-habit-log/
├── backend/
│   ├── api/              # Activities, Goals, Streaks, Achievements, Food Scanner, Chat, Reports
│   ├── users/            # User model and auth endpoints
│   ├── core/             # Emission factors, CO2 calculator, AI chat engine, suggestions
│   ├── backend/          # Django settings, URLs, WSGI
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/        # All 9 page components with CSS
│   │   ├── components/   # Sidebar and layout
│   │   ├── api/          # Axios instance with JWT interceptor
│   │   └── context/      # Auth context
│   ├── public/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Running it locally

You will need Python 3.10+, Node.js 18+, and Git installed.

### 1. Clone the repo

```bash
git clone https://github.com/mohamedibrahim26/ooshma-net-zero-habit-log.git
cd ooshma-net-zero-habit-log
```

### 2. Set up the backend

```bash
cd backend

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac or Linux

pip install -r requirements.txt

copy .env.example .env       # Windows
# cp .env.example .env       # Mac or Linux

python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

The API will be running at `http://localhost:8000`

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

### 4. Environment variables

Open the `.env` file you just created inside the backend folder and fill it in:

```
SECRET_KEY=your-django-secret-key
DEBUG=True
USE_SQLITE=True

EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

For Gmail, you need to generate an App Password from Google Account > Security > 2-Step Verification > App Passwords.

---

## Running with Docker

If you prefer Docker, just run:

```bash
docker-compose up --build
```

Frontend will be at `http://localhost:3000` and the backend at `http://localhost:8000`.

---

## API endpoints

| Method | Endpoint | What it does |
|---|---|---|
| POST | `/api/users/register/` | Create a new account |
| POST | `/api/users/login/` | Login and receive JWT tokens |
| GET/POST | `/api/activities/` | Fetch or create activity logs |
| GET | `/api/activities/dashboard/` | Get dashboard stats |
| GET/POST | `/api/goals/` | Fetch or create goals |
| GET | `/api/streaks/` | Get current streak and achievements |
| POST | `/api/chat/` | Send a message to the AI assistant |
| GET | `/api/food-scan/` | Look up a food product by name or barcode |
| GET | `/api/report/download/` | Download the weekly PDF |
| POST | `/api/report/send/` | Email the weekly PDF to the user |

---

## License

MIT - free to use and modify.
