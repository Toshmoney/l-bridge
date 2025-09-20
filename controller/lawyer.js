const Lawyer = require("../models/Lawyer");
const User = require("../models/User");
const Consultation = require("../models/Consultation");
const {sendConsultationEmail} = require("../helper/sendMail");



const registerLawyer = async (req, res) => {
  try {
    const { specialization, barCertificate } = req.body;
    if (!specialization || specialization.length === 0 || !barCertificate) {
      return res.status(400).json({ message: "Specialization and bar certificate are required" });
    }

    // if specialization is not an array, convert it to an array
    const specializationArray = Array.isArray(specialization) ? specialization : [specialization];
    
    // convert all specialization first letter to uppercase and rest to lowercase and if two words, capitalize both
    const formattedSpecialization = specializationArray.map(spec => {
        return spec.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
    });

    req.body.specialization = formattedSpecialization;

    // Check if user exists
    const user = await User.findById(req.user.userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a lawyer
    const existingLawyer = await Lawyer.findOne({ user: req.user.userId });
    if (existingLawyer) {
        return res.status(400).json({ message: "You already have a lawyer profile" });
    }

    if(user.role != "lawyer" && user.role != "admin"){
        user.role = "lawyer";
        await user.save();
    }

    // Create new lawyer profile
    const lawyer = new Lawyer({
      user: req.user.userId,
      specialization,
      barCertificate
    });

    await lawyer.save();
    res.status(201).json(lawyer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getLawyers = async (req, res) => {
  try {
    const { search, specialization, sortBy = "rating", order = "desc" } = req.query;

    console.log("Query params:", req.query);

    let filter = {};
    if (specialization) {
      filter.specialization = { $in: [specialization] };
    }
    if (search) {
      filter.$or = [
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    const lawyers = await Lawyer.find(filter)
      .populate("user", "name profileDescription profilePicture")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 });

    res.json(lawyers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getLawyerById = async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id)
      .populate("user", "name profileDescription profilePicture")
      .populate("consultations");

    if (!lawyer) return res.status(404).json({ message: "Lawyer not found" });

    res.json(lawyer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookConsultation = async (req, res) => {
  try {
    const { lawyerId, topic, details, scheduledAt } = req.body;

    // Check lawyer exists
    const lawyer = await Lawyer.findById(lawyerId).populate("user", "name email");
    if (!lawyer) return res.status(404).json({ message: "Lawyer not found" });

    // Create consultation
    const consultation = new Consultation({
      lawyer: lawyerId,
      user: req.user.userId,
      topic,
      details,
      scheduledAt,
    });

    await consultation.save();

    // Send email notification to lawyer
    const client = await User.findById(req.user.userId);
    await sendConsultationEmail(lawyer.user.email, lawyer.user.name, client.name, topic, scheduledAt);

    res.status(201).json({
      message: "Consultation booked successfully",
      consultation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ user: req.user.userId })
      .populate({path: "lawyer", populate: { path: "user", select: "name" }})
      .populate("user", "name");
      if (!consultations || consultations.length === 0) {
        return res.status(404).json({ message: "No consultations found" });
      }
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get single consultation by id

const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate({ path: "lawyer", populate: { path: "user", select: "name" } })
      .populate("user", "name email");
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }
    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLawyerConsultations = async (req, res) => {
  try {
    // Find lawyer record for this logged-in user
    const lawyer = await Lawyer.findOne({ user: req.user.userId });
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer profile not found" });
    }

    // Find consultations linked to this lawyer
    const consultations = await Consultation.find({ lawyer: lawyer._id })
      .populate({ path: "lawyer", populate: { path: "user", select: "name" } })
      .populate("user", "name");

    if (!consultations || consultations.length === 0) {
      return res.status(404).json({ message: "No consultations found" });
    }

    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get single lawyer's consultation by id

const getLawyerConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate({ path: "lawyer", populate: { path: "user", select: "name" } })
      .populate("user", "name email");
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }
    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






const verifyLawyer = async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id);
    if (!lawyer) return res.status(404).json({ message: "Lawyer not found" });

    lawyer.verified = true;
    await lawyer.save();

    res.json({ message: "Lawyer verified", lawyer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




module.exports = {
  registerLawyer,
  getLawyers,
  getLawyerById,
  verifyLawyer,
  bookConsultation,
  getConsultations,
  getLawyerConsultations,
  getLawyerConsultationById,
  getConsultationById
};
