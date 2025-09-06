const nodemailer = require("nodemailer")

const sendConsultationEmail = async (lawyerEmail, lawyerName, clientName, topic, scheduledAt) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"MobiDocs" <${process.env.EMAIL_USER}>`,
      to: lawyerEmail,
      subject: `New Consultation Booking - ${topic}`,
      html: `
        <h2>Hello ${lawyerName},</h2>
        <p>You have a new consultation booking from <b>${clientName}</b>.</p>
        <p><b>Topic:</b> ${topic}</p>
        <p><b>Scheduled At:</b> ${new Date(scheduledAt).toLocaleString()}</p>
        <p>Please log into your dashboard to view details.</p>
        <br/>
        <p>– Lawbridge's Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Consultation email sent to:", lawyerEmail);
  } catch (error) {
    console.error("Email error:", error.message);
  }
};

module.exports = sendConsultationEmail