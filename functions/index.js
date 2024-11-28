const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const cors = require('cors'); // Import the CORS package
const express = require('express'); // Express is needed for easier route handling
const app = express();

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Use CORS middleware to allow cross-origin requests
app.use(cors({ origin: true })); // Allow all domains to access the function

// --- CREATE EVENT ---
app.post('/createEvent', async (req, res) => {
  const { title, description, date, location, organizer, eventType, requestId } = req.body;

  // Check for duplicate requestId or event details (title and date are most likely unique)
  const existingEvent = await db.collection('events').where('requestId', '==', requestId).get();
  if (!existingEvent.empty) {
    return res.status(400).send({ message: "Duplicate request detected. The event has already been created." });
  }

  // Additionally, check for a duplicate event with the same title and date
  const duplicateEventCheck = await db.collection('events')
    .where('title', '==', title)
    .where('date', '==', admin.firestore.Timestamp.fromDate(new Date(date))) // Convert to Firestore timestamp
    .get();

  if (!duplicateEventCheck.empty) {
    return res.status(400).send({ message: "An event with the same title and date already exists." });
  }

  // Proceed to create the event if no duplicates are found
  const newEvent = {
    title,
    description,
    date: admin.firestore.Timestamp.fromDate(new Date(date)), // Convert to Firestore timestamp
    location,
    organizer,
    eventType,
    requestId,  // Store the requestId to check for duplicates in the future
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),  // Server-side timestamp
  };

  try {
    // Add the new event to Firestore
    const docRef = await db.collection('events').add(newEvent);
    const createdEventDoc = await docRef.get();
    const createdEventData = createdEventDoc.data();

    res.status(201).send({
      id: docRef.id,
      title,
      description,
      date: new Date(date).toISOString(),  // Return the date as an ISO string
      location,
      organizer,
      eventType,
      updatedAt: createdEventData?.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    });

    console.log(`Event created with ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).send({
      message: "Error creating event",
      error: error.message,
    });
  }
});

// --- GET ALL EVENTS ---
app.get('/getAllEvents', async (req, res) => {
  if (req.method === "GET") {
    try {
      const snapshot = await db.collection("events").get();
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.status(200).json(events);
    } catch (error) {
      console.error("Error getting events:", error);
      res.status(500).send("Error getting events");
    }
  } else {
    res.status(405).send("Method not allowed");
  }
});

// --- GET EVENT BY ID ---
app.get('/getEventById/:id', async (req, res) => {
  const { id } = req.params;

  if (req.method === "GET") {
    try {
      const eventDoc = await db.collection("events").doc(id).get();
      if (!eventDoc.exists) {
        return res.status(404).send("Event not found");
      }
      res.status(200).json({ id: eventDoc.id, ...eventDoc.data() });
    } catch (error) {
      console.error("Error getting event by ID:", error);
      res.status(500).send("Error getting event");
    }
  } else {
    res.status(405).send("Method not allowed");
  }
});

// --- UPDATE EVENT ---
app.put('/updateEvent/:id', async (req, res) => {
  const { id } = req.params;

  if (req.method === "PUT") {
    const { title, description, date, location, organizer, eventType } = req.body;

    const updatedEvent = {
      title,
      description,
      date: admin.firestore.Timestamp.fromDate(new Date(date)),
      location,
      organizer,
      eventType,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      const eventDocRef = db.collection("events").doc(id);
      const doc = await eventDocRef.get();
      if (!doc.exists) {
        return res.status(404).send("Event not found");
      }

      await eventDocRef.update(updatedEvent);
      res.status(200).send({ id, ...updatedEvent });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).send("Error updating event");
    }
  } else {
    res.status(405).send("Method not allowed");
  }
});

// --- DELETE EVENT ---
app.delete('/deleteEvent/:id', async (req, res) => {
  const { id } = req.params;

  if (req.method === "DELETE") {
    try {
      const eventDocRef = db.collection("events").doc(id);
      const doc = await eventDocRef.get();

      if (!doc.exists) {
        return res.status(404).send(`Event with ID ${id} not found. It may have been already deleted.`);
      }

      await eventDocRef.delete();

      // Send a success message with 200 status code
      res.status(200).send({ message: 'Event deleted successfully!' });

    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).send("Error deleting event");
    }
  } else {
    res.status(405).send("Method not allowed");
  }
});

// --- FILTER EVENTS BY EVENT TYPE OR DATE ---
app.get('/filterEvents', async (req, res) => {
  if (req.method === "GET") {
    const { eventType, startDate, endDate } = req.query;

    let query = db.collection("events");

    // Filter by event type if provided
    if (eventType) {
      query = query.where("eventType", "==", eventType);
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(startDate));
      const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(endDate));
      query = query
        .where("date", ">=", startTimestamp)
        .where("date", "<=", endTimestamp);
    }

    try {
      const snapshot = await query.get();
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.status(200).json(events);
    } catch (error) {
      console.error("Error filtering events:", error);
      res.status(500).send("Error filtering events");
    }
  } else {
    res.status(405).send("Method not allowed");
  }
});

// Use the Express app for the exported functions
exports.api = functions.https.onRequest(app);

// --- FIRESTORE TRIGGER TO UPDATE `updatedAt` FIELD ON CREATE ---
exports.updateEventTimestampOnCreate = functions.firestore
  .onDocumentCreated('events/{eventId}', async (snap) => {
    const eventRef = snap.ref;
    const updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // When a new document is created, set the `updatedAt` field
    await eventRef.update({ updatedAt });

    return null;
  });

// --- FIRESTORE TRIGGER TO UPDATE `updatedAt` FIELD ON UPDATE ---
exports.updateEventTimestampOnUpdate = functions.firestore
  .onDocumentUpdated('events/{eventId}', async (change) => {
    const eventRef = change.after.ref;
    const updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // When a document is updated, set the `updatedAt` field
    await eventRef.update({ updatedAt });

    return null;
  });

  