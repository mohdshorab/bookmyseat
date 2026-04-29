# BookMySeat

BookMySeat is a backend API service for event and seat booking. It provides endpoints for users to register, log in, browse events, and securely book seats. The system is designed to handle concurrency during seat selection and booking, ensuring robust data consistency.

## Architecture

The project is built with a standard Node.js/Express MVC (Model-View-Controller) architecture, interacting with a MongoDB database via Mongoose.

- **Framework**: Express.js (Node.js)
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT) & bcrypt for password hashing
- **Validation**: Zod (for request payload validation)
- **Architecture Pattern**: Controller-Service-Route model
  - **Routes**: Define the API endpoints and attach middleware.
  - **Middlewares**: Handle authentication, authorization (admin/user roles), and global error processing.
  - **Controllers**: Contain the core business logic (e.g., handling event creation, seat locking, and booking finalization).
  - **Models**: Define the database schemas (`User`, `Event`, `Seat`, `Booking`).
  - **Validators**: Ensure incoming requests conform to expected shapes before hitting the controllers.

### Concurrency Handling
The seat booking process utilizes a locking mechanism to prevent double-booking. When a user selects a seat, it is temporarily marked as `locked` and assigned an expiration time. If the booking is confirmed before expiration, the status changes to `booked`. If not, it reverts to `available`. Important operations involving multiple records (e.g., cancelling an event and releasing its seats) utilize MongoDB transactions.

## Project Structure

```
bookmyseat/
└── server/
    ├── package.json
    ├── .env                # Environment variables (needs to be created)
    └── src/
        ├── app.js          # Express app entry point
        ├── configs/        # Database connection configuration
        ├── controllers/    # Business logic for auth, events, and bookings
        ├── middlewares/    # Authentication, Role checking, Error handling
        ├── models/         # Mongoose schemas (User, Event, Seat, Booking)
        ├── routes/         # Express routers
        ├── utils/          # Helper utilities
        └── validators/     # Zod schemas for input validation
```

## Setup Instructions

Follow these steps to set up the project locally:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A MongoDB cluster (e.g., [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### 2. Clone the Repository
```bash
git clone https://github.com/mohdshorab/bookmyseat.git
cd bookmyseat/server
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the `server/` directory and add the following keys. Replace the placeholder values with your actual configuration:

```env
PORT=8000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
```

### 5. Run the Server
To start the server in development mode (with nodemon):
```bash
npm run dev
```

The API will be available at `http://localhost:8000`.

## API Endpoints Overview

- **Auth Routes (`/bookmyseat/auth`)**: User registration and login.
- **Event Routes (`/bookmyseat/event`)**: Creating, fetching, and cancelling events. Admin privileges may be required for creation/cancellation.
- **Booking Routes (`/bookmyseat/booking`)**: Locking seats, confirming bookings, and cancelling bookings.

## Key Features

- **Role-Based Access Control (RBAC)**: Distinguishes between `admin` and regular `user` capabilities.
- **Robust Validation**: Zod ensures that only valid data interacts with the database.
- **Transactional Consistency**: Handles event cancellations gracefully by leveraging database transactions.
- **Global Error Handling**: Standardized API error responses across all endpoints.
