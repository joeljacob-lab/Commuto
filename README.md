Commuto

Because someone's already driving your way.

Commuto is a college-exclusive carpool platform. Instead of matching you with random strangers like a taxi app, it connects you with students from your own college who are already driving your daily commute — and splits the fuel cost fairly between everyone in the car.

Built as an MCA final year mini-project.


The Problem

Every day on a college route:

Some students don't own a vehicle and have to depend on buses, autos, or expensive cabs.
Some students do own a vehicle, but drive with empty seats every single day — paying full fuel cost alone.
Neither group has an easy way to find each other, because there's no trusted way to know who else from your own college is going the same way at the same time.

General ride-sharing apps (Uber, Ola) connect you with strangers and charge market fares. Carpool apps like BlaBlaCar or sRide help, but they match you with random people across a city or company — not people who actually go to your college, on your route, at your class timings.

Commuto solves this by turning a college's own commuting population into its own transit network.

What Makes It Different
	Regular taxi apps	General carpool apps	Commuto
Who you travel with	A stranger	A stranger, city-wide	A fellow student from your college
Pricing	Market fare / surge pricing	Fixed fare	Fuel cost split fairly, recalculated daily
Booking	Search every single time	Search every single time	Set up once — matched automatically every day
Trust	Star rating only	Star rating only	College ID verification + shared department + past-ride history
Key Features
Recurring route pools — a driver sets up their daily commute once (e.g. "Angamaly to FISAT, 8 AM, Mon–Fri"). Riders join once instead of searching every morning.
Smart route matching — you don't need to live at the exact start point. If your home is anywhere along the driver's route, the system finds and ranks the match.
Fair, transparent cost sharing — the cost per person is calculated fresh every day from the actual route distance, the vehicle's mileage, and the current fuel price — never a flat, made-up fare.
Safe cancellations — cancel early and your share is refunded, and the cost is fairly redistributed among the remaining riders. Cancel last-minute (or don't show up) and your held payment goes to the driver instead, since they already lost the chance to fill that seat.
Trust you can actually see — ratings, but also signals like "2 people from your department have ridden with this driver before."
Verified community — only students with a valid college email can join, and every vehicle is manually verified before it can be used.
Tech Stack
Layer	Technology
Frontend	React + Vite + Tailwind CSS
Backend	Node.js + Express
Database	MongoDB + Mongoose
Auth	JWT + bcrypt
Real-time	Socket.IO
Maps	Mapbox / Google Maps API
File storage	Cloudinary
How a Ride Actually Works
A driver creates a route pool — their regular commute, with days and a rough departure window.
Every day, the app automatically generates that day's ride, using the current fuel price.
A rider searches (or gets suggested) rides along their route and requests a seat.
The driver accepts. A little before departure, the passenger list locks in, and the exact cost per person is calculated and finalized.
The ride happens. Everyone rates each other afterward.

If someone cancels before the lock, no harm done — the cost is simply redistributed among whoever's left. If they cancel after the lock (or just don't show up), their share stays with the driver as compensation.

Project Structure
commuto/
├── backend/     → Express API, MongoDB models, business logic
└── frontend/    → React app (rider, driver, and admin views)

See Commuto_Folder_Structure.md in the project docs for the full file layout, and Commuto_Implementation_Phases.md for the build order this project follows.

Getting Started
Prerequisites
Node.js (v18+)
A MongoDB Atlas connection string (or local MongoDB)
Cloudinary account (for file uploads)
Mapbox or Google Maps API key
Setup
bash
# Clone the repo
git clone https://github.com/<your-username>/commuto.git
cd commuto

# Backend
cd backend
npm install
cp .env.example .env   # fill in your MongoDB URI, JWT secret, Cloudinary keys
npm run dev

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev

The backend runs on http://localhost:5000 and the frontend on http://localhost:5173 by default.

Project Documentation

This repo includes the full design docs this project was built from:

Commuto_Master_Spec.md — complete architecture, modules, algorithms, and API reference
Commuto_Database_Schema.md — full database design
Commuto_Folder_Structure.md — file layout
Commuto_Implementation_Phases.md — the exact phase-by-phase build order
