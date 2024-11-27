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
  if (req.method === "POST") {
    const { title, description, date, location, organizer, eventType } = req.body;

    // Validate required fields
    if (!title || !description || !date || !location || !organizer || !eventType) {
      return res.status(400).send("Missing required fields");
    }

    // Validate the date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      return res.status(400).send("Invalid date format. Please use a valid date (e.g. yyyy-mm-dd).");
    }

    const newEvent = {
      title,
      description,
      date: admin.firestore.Timestamp.fromDate(parsedDate),  // Convert the date to Firestore timestamp
      location,
      organizer,
      eventType,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),  // Set as Firestore server timestamp
    };

    try {
      // Log the incoming request data for debugging
      console.log("Creating event with data:", newEvent);

      // Add the new event to Firestore
      const docRef = await db.collection("events").add(newEvent);

      // After the document is created, fetch it to include the actual `updatedAt` field value
      const createdEventDoc = await docRef.get();
      const createdEventData = createdEventDoc.data();
      
      // Return the created event with the actual updatedAt and formatted date
      res.status(201).send({
        id: docRef.id,
        title,
        description,
        date: parsedDate.toISOString(),  // Format date to ISO string
        location,
        organizer,
        eventType,
        updatedAt: createdEventData?.updatedAt?.toDate().toISOString() || new Date().toISOString(), // Use the Firestore server timestamp
      });

      // Optional: Log successful creation
      console.log(`Event created with ID: ${docRef.id}`);
    } catch (error) {
      // Log the error for debugging
      console.error("Error creating event:", error);

      // Return a more detailed error response
      res.status(500).send({
        message: "Error creating event",
        error: error.message,
      });
    }
  } else {
    res.status(405).send("Method not allowed");
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

  