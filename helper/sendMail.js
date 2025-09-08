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
      from: `"Lawbridge " <${process.env.EMAIL_USER}>`,
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

const sendWelcomeEmail = async (name, email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Lawbridge " <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Lawbridge platform!",
      html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for joining lawbridge, these are things you enjoy while using our platform</b>:</p>
        <ul>
        <li>Auto-generate legal documents </li>
        <li>Book a consultation with professional lawyers. </li>
        <li>Make money while sleeping by selling legal document formats. </li>
        <li>Chat with your prefered lawyers.</li>
        </ul>
        <br/>
        <p>– Lawbridge's Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("welcome email sent to:", email);
  } catch (error) {
    console.error("Email error:", error.message);
  }
};

module.exports = {
  sendConsultationEmail,
  sendWelcomeEmail
}