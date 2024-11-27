# Event Management Application - Backend Setup
This repository contains the backend for the Event Management Application built using Node.js and Firebase. The backend leverages Firebase Cloud Functions to create serverless endpoints for managing events, with Firebase Firestore serving as the database.

Project Overview
The backend handles operations related to event creation, viewing, updating, and deletion. It also supports filtering events based on attributes like date, location, and event type. This backend will be connected to a Flutter frontend application for user interaction.

## Features
CRUD Operations: Create, Read, Update, and Delete event data in Firebase Firestore.
Filtering: Users can filter events based on selected attributes (e.g., date, type, location).
Serverless API: Firebase Cloud Functions to handle backend logic and serve data to the frontend.
Technologies Used
Node.js: Server-side JavaScript runtime for building the backend.
Firebase: Firebase Cloud Functions for serverless architecture, Firebase Firestore for data storage.
Express: Web framework for handling API requests.
Firestore: NoSQL database for storing event data.
Prerequisites
Before setting up the project, make sure you have the following installed:

Node.js (LTS version recommended)
Firebase CLI
npm (Node Package Manager)
Setup Instructions
1. Clone the Repository
git clone https://github.com/lpattersonn/event-management-backend.git
cd event-management-backend
2. Install Dependencies
Run the following command to install the necessary dependencies for Firebase functions:

npm install
3. Firebase Project Setup
You need to connect your local project to your Firebase project. If you don't have a Firebase project, create one.

Once you've created your Firebase project, link it to your local project:

firebase login
firebase init
During initialization, ensure that the following options are selected:

## Firebase Firestore
Firebase Functions
Firebase Hosting (optional for deployment, but not necessary for the backend)
4. Create .env File for Environment Variables
Create a .env file in the root of the project to store sensitive environment variables. This file will be used to configure Firebase and other settings for your project.

The following environment variables are required:

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_DATABASE_URL=your-database-url
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
Replace each placeholder (your-project-id, your-api-key, etc.) with the corresponding values from your Firebase project settings. You can find these details in the Firebase Console.

To access Firebase settings:

Go to your Firebase console: Firebase Console
Select your project.
Navigate to "Project Settings" (the gear icon in the top-left corner).
Under "Your apps", find your web app and copy the relevant credentials.
5. Configure Firestore Security Rules (Optional)
For development purposes, you may want to set less restrictive security rules for Firestore. For example:

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // For development, set to true. For production, set more secure rules.
    }
  }
}
Important: Ensure you set proper security rules before moving to production to secure your Firestore data.

6. Deploy Firebase Functions
Once your environment is set up, you can deploy the Firebase functions using the Firebase CLI:

firebase deploy --only functions
This will deploy your cloud functions to Firebase, making them available as REST API endpoints.

7. Running the Firebase Emulator (Optional for Local Testing)
If you'd like to test your functions locally before deploying, you can use the Firebase Emulator. Run the following command to start the emulator:

firebase emulators:start
This will start the Firestore and Functions emulators on your local machine, allowing you to test API calls and Firestore interactions without deploying to Firebase.

8. Testing Endpoints
Once your Firebase functions are deployed, you can access the REST API endpoints for CRUD operations related to events. You can use tools like Postman or Insomnia to test the API.

Endpoints (example structure):

GET /events: Retrieve all events.
POST /events: Create a new event.
PUT /events/{id}: Update an event by ID.
DELETE /events/{id}: Delete an event by ID.
GET /events/filter: Filter events based on query parameters (e.g., date, location).
Folder Structure
/event-management-backend
├── /functions          # Firebase Cloud Functions
│   ├── index.js       # Main Firebase Functions file
│   ├── eventController.js  # Event CRUD operations
│   ├── eventModel.js   # Model for Firestore data
├── /public             # Firebase hosting files (optional)
├── .env                # Environment variables file
├── firebase.json       # Firebase configuration
└── package.json        # Node.js dependencies and scripts
Firebase Cloud Functions
Firebase Cloud Functions are located in the functions directory. They are defined and exported in the index.js file. Each function handles a specific endpoint or operation (CRUD, filtering, etc.).

## Next Steps
Once the backend is set up, connect it to your Flutter frontend application.
Set up production Firebase Firestore security rules.
Consider adding features such as user authentication, event search, and notifications.
Troubleshooting
If you encounter errors during deployment or while using Firebase emulators, check the Firebase documentation for troubleshooting tips.
Ensure your .env file is correctly formatted and contains all necessary credentials.
If functions are not responding as expected, check the Firebase Functions logs:
firebase functions:log
License
This project is licensed under the MIT License. See the LICENSE file for details.# event-management-backend
