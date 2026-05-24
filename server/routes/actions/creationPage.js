const express = require('express');
const router = express.Router();
const Create = require('../../models/Create');
const User = require('../../models/User');

router.post('/saved-automations', async (req, res) => {
    const { userId, action, reaction, isActive } = req.body;

    try {
        const newAutomation = new Create({
            userId,
            action,
            reaction,
            isActive: isActive !== undefined ? isActive : true,
            subscribed: false
        });

        const doc = await newAutomation.save();
        res.status(201).json(doc);
    } catch (err) {
        console.error('Error saving automation:', err.message);
        res.status(500).json({ error: 'Failed to save automation', message: err.message });
    }
});

router.get('/saved-automations', async (req, res) => {
  const { userId } = req.query;

  try {
    const filter = userId ? { userId } : {};
    const automations = await Create.find(filter);
    
    res.status(200).json(automations);
  } catch (err) {
    console.error('Error fetching automations:', err.message);
    res.status(500).json({ error: 'Failed to fetch automations', message: err.message });
  }
});

router.get('/current-user', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user info:', err);
        res.status(500).json({ message: 'An error occurred while fetching the user info' });
    }
});

router.delete('/saved-automations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedAutomation = await Create.findByIdAndDelete(id);
    if (!deletedAutomation) {
      return res.status(404).json({ message: 'Automation not found' });
    }
    res.status(200).json({ message: 'Automation deleted successfully' });
  } catch (err) {
    console.error('Error deleting automation:', err.message);
    res.status(500).json({ error: 'Failed to delete automation', message: err.message });
  }
});

router.put('/saved-automations/:id', async (req, res) => {
  const { id } = req.params;
  const { action, reaction, isActive, subscribed } = req.body;

  try {
      const updatedAutomation = await Create.findByIdAndUpdate(
          id,
          { action, reaction, isActive, subscribed },
          { new: true }
      );

      if (!updatedAutomation) {
          return res.status(404).json({ message: 'Automation not found' });
      }

      res.status(200).json(updatedAutomation);
  } catch (err) {
      console.error('Error updating automation:', err.message);
      res.status(500).json({ error: 'Failed to update automation', message: err.message });
  }
});

router.get('/current-user', async (req, res) => {
  try {
      const user = await User.findById(req.user.id);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
  } catch (err) {
      console.error('Error fetching user info:', err.message);
      res.status(500).json({ error: 'Failed to fetch user info', message: err.message });
  }
});

module.exports = router;