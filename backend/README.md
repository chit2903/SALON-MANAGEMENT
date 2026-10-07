# Salon Management Backend Server

Simple Express-based REST API backend for the Salon Management System.

## Features
- **Zero Frontend Changes Needed**: Designed to plug directly into the frontend at `http://localhost:3001`.
- **Authentication API**: `POST /api/auth/login` (supports demo users like `admin` / `admin123`, `user` / `user123`, `owner` / `owner123`, `reception` / `reception123`).
- **Appointments API**: `GET`, `POST`, `PUT`, `DELETE` for `/api/appointments`.
- **Full Resource APIs**: `GET`, `POST`, `PUT`, `DELETE` endpoints for `salons`, `services`, `customers`, `staff`, `users`, `packages`, `memberships`, `products`, `invoices`, `expenses`, `feedback`, `notifications`, `offers`, `coupons`, `giftCards`.
- **JSON File Persistence**: Automatically saves and loads data from `db.json`.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server
```bash
npm start
```
Or with auto-reload:
```bash
npm run dev
```

The server runs on **`http://localhost:3001`**.

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - User login
- `GET /api/appointments` - Fetch appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/salons` - Get salons list
- `GET /api/services` - Get services list
