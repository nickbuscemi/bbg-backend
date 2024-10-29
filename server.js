// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'https://bugsbgoneny.com'], // Replace with your frontend URLs
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

// read email html
const contact_response_template = fs.readFileSync('./email-templates/contact_response_template.html', 'utf8');

// Endpoint to handle quote form submissions
app.post('/api/get-quote', async (req, res) => {
  console.log('Received request to /api/get-quote');

  const { name, email, phone, message } = req.body;

  // Validate required fields
  if (!name || !email || !phone) {
    return res.status(400).send('Missing required fields: name, email, and phone are required.');
  }

  try {
    console.log('Processing form submission');

    // Send a success response before sending emails
    res.status(201).send('Your quote request has been received. We will contact you shortly.');

    // Email to you with the quote details
    const mailOptionsToOwner = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Replace with your email
      subject: 'New Quote Request Received',
      text: `You have received a new quote request:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message || 'N/A'}`,
    };

    // Confirmation email to the user
    const mailOptionsToUser = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Thank You for Your Quote Request',
      html: contact_response_template.replace('{(name)}', name.split(' ')[0]),
    };

    // Send emails asynchronously
    setImmediate(async () => {
      try {
        console.log('Sending email to owner');
        await transporter.sendMail(mailOptionsToOwner);
        console.log('Email to owner sent successfully');
      } catch (error) {
        console.error('Error sending email to owner:', error);
      }

      try {
        console.log('Sending confirmation email to user');
        await transporter.sendMail(mailOptionsToUser);
        console.log('Confirmation email sent to user successfully');
      } catch (error) {
        console.error('Error sending confirmation email to user:', error);
      }
    });
  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).send('An error occurred while processing your request.');
  }
});

// Test endpoint
app.get('/', (req, res) => {
  res.send('Backend server is running successfully!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
