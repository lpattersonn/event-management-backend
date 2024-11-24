class Event {
    constructor(id, title, description, date, location, organizer, eventType, updatedAt) {
      (this.id = id),
        (this.title = title),
        (this.description = description),
        (this.date = date),
        (this.location = location),
        (this.organizer = organizer),
        (this.eventType = eventType),
        (this.updatedAt = updatedAt);
    }
  }
  
  export default Event;