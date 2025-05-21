# PrintiFy

PrintiFy is a web-based printing service that allows users to upload, manage, and print PDF documents. It includes features for user authentication, print job management, and administrative controls.

## Project Structure

The project is organized into two main directories:

- `client`: Contains the React frontend built with Vite
- `server`: Contains the Node.js/Express backend

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yusaislam48/PrintiFy.git
   cd PrintiFy
   ```

2. Install dependencies for both client and server
   ```bash
   npm run install-all
   ```

3. Set up environment variables
   - Create a `.env` file in the server directory based on the example provided

### Running the Application

To run both client and server concurrently:
```bash
npm run dev
```

To run only the client:
```bash
npm run client
```

To run only the server:
```bash
npm run server
```

## Features

- User authentication and authorization
- PDF document upload and management
- Print job tracking
- Direct printing to local printers
- Administrative dashboard
- User points system for print credits

## Technologies Used

### Frontend
- React
- Material UI
- PDF.js for PDF rendering
- Axios for API requests

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication
- Cloudinary for file storage
- PDF-to-printer for direct printing
