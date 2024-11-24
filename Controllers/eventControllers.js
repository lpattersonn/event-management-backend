import firebase from '../firebase.js';
import Event from '../Models/eventModel.js';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const db = getFirestore(firebase);

// Create event
export const createEvent = async (req, res, next) => {
    try {
      const data = req.body;
      await addDoc(collection(db, 'events'), data);
      res.status(200).send('event created successfully');
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

// Get all events
export const getEvents = async (req, res, next) => {
    try {
      const events = await getDocs(collection(db, 'events'));
      const eventArray = [];
  
      if (events.empty) {
        res.status(400).send('No Events found');
      } else {
        events.forEach((doc) => {
          const event = new Event(
            doc.id,
            doc.data().title,
            doc.data().description,
            doc.data().date,
            doc.data().location,
            doc.data().organizer,
            doc.data().eventType,
            doc.data().updatedAt,
          );
          eventArray.push(event);
        });
  
        res.status(200).send(eventArray);
      }
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

// Get event by ID
export const getEvent = async (req, res, next) => {
    try {
      const id = req.params.id;
      const event = doc(db, 'events', id);
      const data = await getDoc(event);
      if (data.exists()) {
        res.status(200).send(data.data());
      } else {
        res.status(404).send('event not found');
      }
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

// Update event by ID
export const updateEvent = async (req, res, next) => {
    try {
      const id = req.params.id;
      const data = req.body;
      const event = doc(db, 'events', id);
      await updateDoc(event, data);
      res.status(200).send('event updated successfully');
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

// Delet event
export const deleteEvent = async (req, res, next) => {
    try {
      const id = req.params.id;
      await deleteDoc(doc(db, 'events', id));
      res.status(200).send('event deleted successfully');
    } catch (error) {
      res.status(400).send(error.message);
    }
  };
  