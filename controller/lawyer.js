const Lawyer = require("../models/Lawyer");
const User = require("../models/User");
const Consultation = require("../models/Consultation");
const {sendConsultationEmail} = require("../helper/sendMail");
const axios = require("axios");
const Purchase = require("../models/Purchase");
const CustomTemplate = require("../models/CustomTemplate");
const Transaction = require("../models/Transaction");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;




const registerLawyer = async (req, res) => {
  try {
    const { specialization, barCertificate, consultationFee } = req.body;
    if (!specialization || specialization.length === 0 || !barCertificate) {
      return res.status(400).json({ message: "Specialization and bar certificate are required" });
    }

    if(!consultationFee){
      return res.status(400).json({message:"consultation fee is required!"})
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
      barCertificate,
      consultationFee
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
    if(!lawyer.consultationFee){
      lawyer.consultationFee = 0;
      await lawyer.save();
    }

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
    await sendConsultationEmail(lawyer.user.email, lawyer.user.name, client.name, topic, scheduledAt, req.user.userId);

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
      .populate("user", "name")
      .sort({ createdAt: -1 });
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
      .populate("user", "name")
      .sort({ scheduledAt: -1 });

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


const verifyPurchase = async (req, res) => {
  try {
    const { reference, templateId } = req.body;
    const buyerId = req.user.userId;

    if (!reference || !templateId) {
      return res.status(400).json({ message: "Reference and templateId required" });
    }

    // 1. Verify with Paystack
    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const verification = verifyRes.data;
    if (verification.data.status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    // 2. Get Template + Lawyer
    const template = await CustomTemplate.findById(templateId).populate("user");
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const lawyer = await Lawyer.findOne({ user: template.user._id });
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    // 3. Save Purchase
    const purchase = await Purchase.create({
      user: buyerId,
      template: templateId,
      amount: template.price,
      reference,
      status: "success",
    });

    await Transaction.create({
      user: lawyer._id,
      status: "completed",
      reference_number: reference,
      description: `₦${template.price} received from ${template.templateType || "custom"} template sold!`,
      type: "credit",
      amount: template.price,
    });

    // 4. Increment Lawyer’s balance
    lawyer.balance = (lawyer.balance || 0) + template.price;

    template.buyer = buyerId;

    await Promise.all([lawyer.save(), template.save()]);

    res.status(200).json({
      message: "Purchase successful",
      purchase,
    });
  } catch (err) {
    console.error("Verify Purchase Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



const getWallet = async (req, res) => {
  try {
    const userId = req.user.userId;

    // find lawyer profile
    const lawyer = await Lawyer.findOne({ user: userId });
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    // fetch all transactions
    const transactions = await Transaction.find({ user: lawyer._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      balance: lawyer.balance || 0,
      transactions,
    });
  } catch (err) {
    console.error("Wallet Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const withdrawMoney = async (req, res) => {
  try {
    const userId = req.user.userId; // from auth middleware
    const { amount, bankAccount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    // Get lawyer wallet
    const lawyer = await Lawyer.findOne({ user: userId });
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    if (lawyer.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct balance
    lawyer.balance -= amount;
    await lawyer.save();

    // Create transaction
    const trx = await Transaction.create({
      user: lawyer._id,
      type: "debit",
      amount,
      status: "pending", // maybe admin needs to approve
      reference_number: `WD_${Date.now()}`,
      description: `Withdrawal of ₦${amount} to ${bankAccount || "bank account"}`,
    });

    res.status(200).json({
      message: "Withdrawal request submitted successfully",
      balance: lawyer.balance,
      transaction: trx,
    });
  } catch (err) {
    console.error("Withdraw Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
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
  getConsultationById,
  verifyPurchase,
  getWallet,
  withdrawMoney
};
