import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

/**
 * Browse all events with filters
 * GET /api/events
 */
export const browseEvents = async (req, res) => {
  try {
    const {
      search,
      eventType,
      eligibility,
      startDate,
      endDate,
      followedOnly,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { status: "PUBLISHED" };

    // Search by name/description
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by event type
    if (eventType) {
      query.eventType = eventType.toUpperCase();
    }

    // Filter by eligibility
    if (eligibility) {
      query.eligibility = eligibility.toUpperCase();
    }

    // Filter by date range
    if (startDate || endDate) {
      query.eventStartDate = {};
      if (startDate) query.eventStartDate.$gte = new Date(startDate);
      if (endDate) query.eventStartDate.$lte = new Date(endDate);
    }

    // Filter by followed organizers only
    if (followedOnly === "true" && req.user) {
      query.organizer = { $in: req.user.followedOrganizers };
    }

    const events = await Event.find(query)
      .populate("organizer", "organizerName category")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-customForm"); // Don't send form structure in list view

    const count = await Event.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

/**
 * Get trending events (top 5 in last 24 hours by registrations)
 * GET /api/events/trending
 */
export const getTrendingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "PUBLISHED",
      eventStartDate: { $gte: new Date() },
    })
      .populate("organizer", "organizerName category")
      .sort({ registrationsLast24h: -1, views: -1 })
      .limit(5)
      .select("-customForm");

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending events",
      error: error.message,
    });
  }
};

/**
 * Get single event details
 * GET /api/events/:id
 */
export const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "organizerName category description contactEmail"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Increment view count
    event.views += 1;
    await event.save();

    // Check if user is already registered (if logged in)
    let isRegistered = false;
    if (req.user) {
      const existingRegistration = await Registration.findOne({
        participant: req.user._id,
        event: event._id,
        status: { $in: ["CONFIRMED", "PENDING"] },
      });
      isRegistered = !!existingRegistration;
    }

    res.json({
      success: true,
      event,
      isRegistered,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event details",
      error: error.message,
    });
  }
};

/**
 * Create new event (Organizer only)
 * POST /api/events
 */
export const createEvent = async (req, res) => {
  try {
    const {
      eventName,
      description,
      eventType,
      eligibility,
      registrationLimit,
      registrationDeadline,
      eventStartDate,
      eventEndDate,
      registrationFee,
      tags,
      customForm,
      merchandise,
    } = req.body;

    // Basic validation
    if (!eventName || !description || !eventType || !registrationDeadline || !eventStartDate || !eventEndDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Create event
    const event = await Event.create({
      eventName,
      description,
      eventType: eventType.toUpperCase(),
      eligibility: eligibility || "ALL",
      registrationLimit,
      registrationDeadline,
      eventStartDate,
      eventEndDate,
      registrationFee: registrationFee || 0,
      tags,
      organizer: req.user._id,
      customForm: eventType.toUpperCase() === "NORMAL" ? customForm : undefined,
      merchandise: eventType.toUpperCase() === "MERCHANDISE" ? merchandise : undefined,
      status: "DRAFT",
    });

    res.status(201).json({
      success: true,
      message: "Event created as draft",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
};
