import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

/**
 * Get participant profile
 * GET /api/participant/profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("followedOrganizers", "organizerName category");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      profile: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

/**
 * Update participant profile
 * PUT /api/participant/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      contactNumber,
      collegeName,
    } = req.body;

    // Fields that can be updated
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (contactNumber) updates.contactNumber = contactNumber;
    if (collegeName) updates.collegeName = collegeName;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

/**
 * Set/Update participant preferences
 * PUT /api/participant/preferences
 */
export const setPreferences = async (req, res) => {
  try {
    const { interests, followedOrganizers } = req.body;

    const updates = {};
    if (interests !== undefined) updates.interests = interests;
    if (followedOrganizers !== undefined) updates.followedOrganizers = followedOrganizers;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("followedOrganizers", "organizerName category");

    res.json({
      success: true,
      message: "Preferences updated successfully",
      profile: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update preferences", error: error.message });
  }
};

/**
 * Get all registrations for participant
 * GET /api/participant/registrations
 */
export const getMyRegistrations = async (req, res) => {
  try {
    const { type, status } = req.query;

    const query = { participant: req.user._id };
    
    if (type) query.registrationType = type.toUpperCase();
    if (status) query.status = status.toUpperCase();

    const registrations = await Registration.find(query)
      .populate("event", "eventName eventType eventStartDate eventEndDate organizer")
      .populate({
        path: "event",
        populate: { path: "organizer", select: "organizerName" },
      })
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch registrations", error: error.message });
  }
};

/**
 * Get upcoming events for participant
 * GET /api/participant/upcoming
 */
export const getUpcomingEvents = async (req, res) => {
  try {
    const registrations = await Registration.find({
      participant: req.user._id,
      status: "CONFIRMED",
    })
      .populate("event")
      .populate({
        path: "event",
        match: { eventStartDate: { $gte: new Date() } },
        populate: { path: "organizer", select: "organizerName" },
      })
      .sort({ "event.eventStartDate": 1 });

    // Filter out null events (past events)
    const upcomingRegistrations = registrations.filter((reg) => reg.event !== null);

    res.json({
      success: true,
      count: upcomingRegistrations.length,
      events: upcomingRegistrations,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch upcoming events", error: error.message });
  }
};

/**
 * Follow/Unfollow an organizer
 * POST /api/participant/follow/:organizerId
 */
export const toggleFollowOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await User.findOne({
      _id: organizerId,
      role: "organizer",
      isActive: true,
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const user = await User.findById(req.user._id);
    const isFollowing = user.followedOrganizers.includes(organizerId);

    if (isFollowing) {
      // Unfollow
      user.followedOrganizers = user.followedOrganizers.filter(
        (id) => id.toString() !== organizerId
      );
    } else {
      // Follow
      user.followedOrganizers.push(organizerId);
    }

    await user.save();

    res.json({
      success: true,
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      following: !isFollowing,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle follow", error: error.message });
  }
};

/**
 * Get list of all organizers
 * GET /api/participant/organizers
 */
export const getOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({
      role: "organizer",
      isActive: true,
    }).select("organizerName category description contactEmail");

    res.json({
      success: true,
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch organizers", error: error.message });
  }
};

/**
 * Get organizer details with their events
 * GET /api/participant/organizers/:organizerId
 */
export const getOrganizerDetails = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await User.findOne({
      _id: organizerId,
      role: "organizer",
      isActive: true,
    }).select("organizerName category description contactEmail");

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Get organizer's published events
    const upcomingEvents = await Event.find({
      organizer: organizerId,
      status: "PUBLISHED",
      eventStartDate: { $gte: new Date() },
    }).select("eventName eventType eventStartDate registrationFee");

    const pastEvents = await Event.find({
      organizer: organizerId,
      status: { $in: ["COMPLETED", "CLOSED"] },
    })
      .select("eventName eventType eventStartDate")
      .limit(10);

    res.json({
      success: true,
      organizer,
      upcomingEvents,
      pastEvents,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch organizer details", error: error.message });
  }
};
