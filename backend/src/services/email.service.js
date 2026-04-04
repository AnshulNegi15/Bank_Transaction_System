// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: process.env.EMAIL_USER,
//     clientId: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     refreshToken: process.env.REFRESH_TOKEN,
//   },
// });

// // Verify the connection configuration
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('Error connecting to email server:', error);
//   } else {
//     console.log('Email server is ready to send messages');
//   }
// });

// // Function to send email
// const sendEmail = async (to, subject, text, html) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
//       to, // list of receivers
//       subject, // Subject line
//       text, // plain text body
//       html, // html body
//     });

//     console.log('Message sent: %s', info.messageId);
//     console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// };

// async function sendRegistrationEmail(userEmail, name){
//   const subject = "Welcome to Backendn Ledger"
//   const text = `Hello ${name}, \n\nThankyou for registering at backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`
//   const html = `<p>Hello ${name},</p><p>Thankyou for registering at backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`

//   await sendEmail(userEmail, subject, text, html)
// } 

// module.exports = {
//   sendRegistrationEmail
// }



const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const createTransporter = async () => {
  console.log('REFRESH_TOKEN:', process.env.REFRESH_TOKEN); // debug line

  const OAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  OAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

  const accessToken = await OAuth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });
};

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to Backend Ledger";
  const text = `Hello ${name},\n\nThank you for registering at Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionSuccessfulEmail(userEmail, name, amount, toAccount){
  const subject = "Transaction Successful"
  const text = `Hello ${name},\n\nYour transaction of $${amount} from account ${fromAccount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`
  const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} from account ${fromAccount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`

  await sendEmail(userEmail, subject, text, html)
}

async function sendTransactionFailedEmail(userEmail, name, amount, toAccount){
  const subject = "Transaction Failed"
  const text = `Hello ${name},\n\nYour transaction of $${amount} from account ${fromAccount} to account ${toAccount} has failed. Please check your account balance and try again.\n\nBest regards,\nThe Backend Ledger Team`
  const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} from account ${fromAccount} to account ${toAccount} has failed. Please check your account balance and try again.</p><p>Best regards,<br>The Backend Ledger Team</p>`

  await sendEmail(userEmail, subject, text, html)
}


module.exports = {
  sendRegistrationEmail,
  sendTransactionSuccessfulEmail,
  sendTransactionFailedEmail
}