const express = require('express');
const router = express.Router();
const { sendEmailNotification } = require('../../utils/email');

router.post('/webhook', async (req, res) => {
  try {
    const { list_folder } = req.body;
    
    if (list_folder && list_folder.entries) {
      for (const entry of list_folder.entries) {
        if (entry['.tag'] === 'file') {
          const filePath = entry.path_lower;
          const action = entry['.tag'] === 'file' ? 'modifié' : 'ajouté';

          await sendEmailNotification(filePath, action);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;
