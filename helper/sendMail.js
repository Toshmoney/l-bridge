const nodemailer = require("nodemailer")

const sendConsultationEmail = async (lawyerEmail, lawyerName, clientName, topic, scheduledAt, chatId) => {
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
        <p>Please start a chat with this through <a href="${process.env.frontendUrl}/dashboard/chats/${chatId}">their profile</a></p>
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

// send email after user sent a message to lawyer

const sendMessageNotificationEmail = async (lawyerEmail, lawyerName, clientName, message, chatId) => {
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
      subject: `New Message from ${clientName}`,
      html: `
        <h2>Hello ${lawyerName},</h2>
        <p>You have received a new message from <b>${clientName}</b>:</p>
        <blockquote style="border-left: 4px solid #ccc; margin: 10px 0; padding-left: 10px; color: #555;">
          ${message}
        </blockquote>
        <p>Please respond to them through <a href="${process.env.frontendUrl}/dashboard/chats/${chatId}">their profile</a></p>
        <br/>
        <p>– Lawbridge's Team</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log("Message notification email sent to:", lawyerEmail);
  } catch (error) {
    console.error("Email error:", error.message);
  }
};

module.exports = {
  sendConsultationEmail,
  sendWelcomeEmail,
  sendMessageNotificationEmail,
}