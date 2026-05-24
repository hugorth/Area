const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SERVICE_CLIENT_ID,
    pass: process.env.GMAIL_SERVICE_CLIENT_SECRET,
  },
});

const sendEmailNotification = async (filePath, action) => {
  const mailOptions = {
    from: process.env.GMAIL_SERVICE_CLIENT_ID,
    to: 'jean.parille@gmail.com', // Remplacez par les adresses email des personnes concernées
    subject: `Fichier ${action} dans Dropbox`,
    text: `Un fichier important a été ${action} dans Dropbox : ${filePath}. Cliquez ici pour voir les modifications : https://www.dropbox.com/home${filePath}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendEmailNotification };