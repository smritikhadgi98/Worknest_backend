import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // Gmail service
    auth: {
      user: process.env.SMTP_EMAIL, // Your email address (e.g., "your-email@gmail.com")
      pass: process.env.SMTP_PASSWORD || "your-app-password", // Use the app password if no regular password is set
    },

    debug: true, // Enable debug mode for more information
  logger: true, // Log information to the console
  });

  const mailOptions = {
    from: `"WORKNEST" <${process.env.SMTP_EMAIL}>`, // Sender's email address
    to: options.email, // Recipient email address
    subject: options.subject, // Subject of the email
    text: options.message, // Body of the email
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};

export default sendEmail;
