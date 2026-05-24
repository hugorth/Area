const express = require("express");
const router = express.Router();

router.get('/terms', (req, res) => {
    res.send(`
      <html>
        <head><title>Terms of Service</title></head>
        <body>
          <h1>Terms of Service</h1>
          <p>Welcome to our service. By using our application, you agree to the following terms...</p>
          <!-- Ajouter les termes ici -->
        </body>
      </html>
    `);
});

module.exports = router;
  