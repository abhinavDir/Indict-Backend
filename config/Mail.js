// import nodemailer from "nodemailer";
// import dotenv from "dotenv"

// dotenv.config();

// const transporter = nodemailer.createTransport({
// service: "gmail",
//   port: 465,
//   secure: true, 
//   auth: {
//     user:process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
//     tls: {
//     rejectUnauthorized: false, 
//     },
// });

// export const SendMail = async (to, otp) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Support Team" <${process.env.EMAIL}>`,
//       to,
//       subject: "Reset Your Password",
//       html: `
//         <p>⚠️ Do not share this OTP with anyone.</p>
//         <h2>${otp}</h2>
//         <p>This OTP will expire in <b>5 minutes</b>.</p>
//       `,
//     });

//     console.log("Email sent:", info.messageId);
//     return true;
//   } catch (error) {
//     console.error("Mail error:", error);
//     return false;
//   }
// };

import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const SendMail = async (to, otp) => {
  try {
    await sgMail.send({
      to,
      from: process.env.FROM_EMAIL, // verified sender
      subject: "Reset Your Password",
      html: `
        <p>⚠️ Do not share this OTP with anyone.</p>
        <h2>${otp}</h2>
        <p>This OTP will expire in <b>5 minutes</b>.</p>
      `,
    });

    console.log("Email sent to:", to);
    return true;
  } catch (error) {
    console.error("SendGrid Mail error:", error.response?.body || error);
    return false;
  }
};
