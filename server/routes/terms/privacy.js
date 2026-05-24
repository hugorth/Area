const express = require("express");
const router = express.Router();

router.get('/privacy', (req, res) => {
    res.send(`
      <html>
        <head><title>Privacy Policy</title></head>
        <body>
          <h1>Privacy Policy</h1>
          <p>We value your privacy and strive to protect your personal data. Here's how we handle your data...</p>
          <!-- Ajouter les détails de la politique de confidentialité -->
        </body>
      </html>
    `);
});

module.exports = router;
  