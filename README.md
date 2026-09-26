Commuto

> **Because someone's already driving your way.**

Commuto is a **college-exclusive carpool platform**. Instead of matching you with random strangers like a taxi app, it connects you with students from your own college who are already driving your daily commute — and splits the fuel cost fairly between everyone in the car.

Built as an **MCA final year mini-project**.

---

## The Problem

Every day on a college route:

- Some students don't own a vehicle and have to depend on buses, autos, or expensive cabs.
- Some students do own a vehicle, but drive with empty seats every single day — paying full fuel cost alone.
- Neither group has an easy way to find each other, because there's no trusted way to know who else from your own college is going the same way at the same time.

General ride-sharing apps such as **Uber** and **Ola** connect you with strangers and charge market fares.

Carpool apps like **BlaBlaCar** or **sRide** help, but they match you with random people across a city or company — not people who actually go to your college, on your route, at your class timings.

**Commuto solves this by turning a college's own commuting population into its own transit network.**

---

## What Makes It Different

| | Regular Taxi Apps | General Carpool Apps | Commuto |
|---|---|---|---|
| **Who you travel with** | A stranger | A stranger, city-wide | A fellow student from your college |
| **Pricing** | Market fare / surge pricing | Fixed fare | Fuel cost split fairly |
| **Booking** | Search every single time | Search every single time | Set up once — matched automatically every day |
| **Trust** | Star rating only | Star rating only | College ID verification + shared department + past-ride history |

---

## Key Features

### 1. Recurring Route Pools

A driver sets up their daily commute once.

For example:

> **Angamaly → FISAT, 8:00 AM, Monday–Friday**

Riders can join the route once instead of searching for a ride every morning.

### 2. Smart Route Matching

You don't need to live at the exact starting point.

If your home is anywhere along the driver's route, the system finds and ranks the match based on the route.

### 3. Fair, Transparent Cost Sharing

The cost per person is calculated fresh every day based on:

- Actual route distance
- Vehicle mileage
- Current fuel price
- Number of riders

There is no flat or arbitrary fare.

### 4. Safe Cancellations

If a rider cancels early, their share is refunded and the cost is fairly redistributed among the remaining riders.

If they cancel last-minute or don't show up, their held payment goes to the driver as compensation because the driver has already lost the opportunity to fill that seat.

### 5. Trust You Can Actually See

Commuto provides more than just star ratings.

Users can see trust signals such as:

> **"2 people from your department have ridden with this driver before."**

This helps students make more informed decisions when choosing a ride.

### 6. Verified Community

Only students with a **valid college email** can join.

Every vehicle is also **manually verified** before it can be used for rides.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT + bcrypt |
| **Real-time Communication** | Socket.IO |
| **Maps** | Mapbox / Google Maps API |
| **File Storage** | Cloudinary |

---

## How a Ride Actually Works

### Step 1 — Create a Route Pool

A driver creates their regular commute with:

- Starting point
- Destination
- Days of travel
- Approximate departure time
- Available seats
- Vehicle details

### Step 2 — Daily Ride Generation

Every day, the app automatically generates that day's ride using the **current fuel price**.

### Step 3 — Find a Ride

A rider searches for available rides or receives suggested rides along the driver's route.

### Step 4 — Request a Seat

The rider requests a seat from the driver.

### Step 5 — Driver Accepts

The driver reviews the request and accepts the rider.

### Step 6 — Ride Lock

A short time before departure, the passenger list is locked.

The **exact cost per person** is then calculated and finalized.

### Step 7 — Ride

The driver and riders complete the journey.

### Step 8 — Rating

After the ride, everyone can rate each other.

### Cancellation Rules

- **Before the lock:** The rider's share is refunded and redistributed among the remaining riders.
- **After the lock:** The rider's held share stays with the driver as compensation.
- **No-show:** The driver's compensation is retained according to the cancellation policy.

---

## Project Structure

```text
commuto/
├── backend/
│   └── Express API, MongoDB models, business logic
│
└── frontend/
    └── React application
        ├── Rider views
        ├── Driver views
        └── Admin views
