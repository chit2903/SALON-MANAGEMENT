# Salon Management Frontend - 50% Summary

## Project Overview
This repository contains the frontend application for a Salon Management System built with React, Vite, and Tailwind CSS. It is designed as a modern user interface for salon staff and customers to manage appointments, customers, bookings, and salon details.

## Key Features
- React + Vite application scaffold with fast development server and build setup.
- Styled with Tailwind CSS and custom theme support.
- Includes reusable UI components for dialogs, forms, navigation, tables, and layout.
- Uses React Router for page routing and app navigation.

## Main Structure
- `src/main.tsx` - app entry point.
- `src/app/App.tsx` - top-level app shell and router setup.
- `src/app/layouts/` - main and user layout components.
- `src/app/pages/` - pages for Dashboard, Appointments, Customers, MyBookings, SalonDetails, Login, and UserDashboard.
- `src/app/components/ui/` - reusable UI primitives and custom components.
- `src/app/contexts/AuthContext.tsx` - authentication and application state context.
- `src/app/services/storage.ts` - storage utilities for local data.
- `src/styles/` - global CSS, Tailwind config, and theme styling.

## Important Notes
- Dependencies are managed with npm and rely on React ecosystem packages, MUI icons, Radix UI primitives, and various utility libraries.
- The project is not a full backend solution; it focuses on frontend behavior and UI presentation.
- The README recommends running `npm install` and `npm run dev` to start the local development server.

## Summary
This project is a ready-to-run frontend template for salon management. It delivers the essential app structure, navigation, reusable components, and styling needed to support salon operations in a browser-based UI.
