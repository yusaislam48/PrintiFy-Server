# PrintiFy Server

This is the server component of PrintiFy, a web-based printing service that allows users to upload, manage, and print PDF documents. It includes features for user authentication, print job management, and administrative controls.

## Features

- User authentication and authorization
- PDF document upload and management
- Print job tracking
- Direct printing to local printers
- Administrative dashboard
- User points system for print credits

## Technologies Used

- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication
- Cloudinary for file storage
- PDF-to-printer for direct printing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yusaislam48/PrintiFy-Server.git
   cd PrintiFy-Server
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the server directory with the following variables:
     ```
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret
     ```

### Running the Application

To run the server in development mode:
```bash
npm run dev
```

To run the server in production mode:
```bash
npm start
```
