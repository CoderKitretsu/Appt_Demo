# Admin App - Appointment Booking System

**Admin (Business) Side** - Built with Vite + React (JavaScript)

This is the admin interface for the appointment booking webapp, providing business owners and staff with comprehensive tools to manage their scheduling operations.

## Responsibilities

The admin app handles:
- Business onboarding and setup
- Team member management 
- Services catalog management
- Availability and schedule configuration
- Appointment management and booking
- Admin calendar views
- Data export/import functionality
- Audit logs and reporting

## Project Structure

```
src/
  main.jsx
  App.jsx
  /assets
  /styles
  /components
  /features
  /pages
  /services
    /adapters
    /models
    /migrations
  /hooks
  /utils
  /store
  /mock
  /migrations
  /tests
index.html
package.json
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run linter
npm run lint
```

## Getting Started

1. Clone the repository and install dependencies
2. Run `npm run dev` to start the development server
3. Use the "Seed Data" button in development to populate sample data
4. Follow the onboarding flow to set up your business

## How to Use Development Instructions

This project includes detailed step-by-step implementation instructions. Copy prompts from the instruction file one-by-one and run the acceptance tests described for each step before moving to the next step.

## Tech Stack

- **Frontend**: Vite + React (JavaScript)
- **Storage**: localStorage (MVP) → PostgreSQL (production)
- **Routing**: React Router v6
- **Styling**: Tailwind-ready classes
- **State Management**: React hooks + Context API
