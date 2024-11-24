/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Express
const app = express();
app.use(express.json()); // for parsing application/json

// Firestore reference
const db = admin.firestore();

// CRUD Routes
// 1. Create Event
app.post("/events", async (req, res) => {
  const {name, date, location, description} = req.body;

  if (!name || !date || !location || !description) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const eventRef = db.collection("events").doc();
    await eventRef.set({
      name,
      date,
      location,
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).send({id: eventRef.id, name, date, location, description});
  } catch (error) {
    res.status(500).send("Error creating event: " + error.message);
  }
});

// 2. Get All Events
app.get("/events", async (req, res) => {
  try {
    const snapshot = await db.collection("events").get();
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(events);
  } catch (error) {
    res.status(500).send("Error fetching events: " + error.message);
  }
});

// 3. Get Event by ID
app.get("/events/:id", async (req, res) => {
  const {id} = req.params;

  try {
    const eventDoc = await db.collection("events").doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).send("Event not found");
    }

    res.status(200).json({id: eventDoc.id, ...eventDoc.data()});
  } catch (error) {
    res.status(500).send("Error fetching event: " + error.message);
  }
});

// 4. Update Event by ID
app.put("/events/:id", async (req, res) => {
  const {id} = req.params;
  const {name, date, location, description} = req.body;

  if (!name || !date || !location || !description) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const eventRef = db.collection("events").doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).send("Event not found");
    }

    await eventRef.update({
      name,
      date,
      location,
      description,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({id, name, date, location, description});
  } catch (error) {
    res.status(500).send("Error updating event: " + error.message);
  }
});

// 5. Delete Event by ID
app.delete("/events/:id", async (req, res) => {
  const {id} = req.params;

  try {
    const eventRef = db.collection("events").doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).send("Event not found");
    }

    await eventRef.delete();
    res.status(200).send(`Event with ID ${id} deleted`);
  } catch (error) {
    res.status(500).send("Error deleting event: " + error.message);
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
