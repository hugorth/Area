const express = require("express");
const router = express.Router();
const Service = require('../../models/Service');
const UserService = require('../../models/UserService');
const verifyToken = require('../../middleware/authMiddleware');

router.get("/", async (req, res) => {
    try {
        const services = await Service.find();
        if (services.length === 0) {
            return res.status(404).send('No services found');
        }
        res.status(200).json(services);
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).send('Server error');
    }
});

router.get("/services/:id", async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).send('Service not found');
        }
        res.status(200).json(service);
    } catch (err) {
        console.error('Error fetching service:', err);
        res.status(500).send('Server error');
    }
});

router.post("/subscribe", verifyToken, async (req, res) => {
  const { service_id } = req.body;
  const userId = req.user.id;
  console.log('userId:', userId, 'service_id:', service_id);

  if (!service_id) {
    return res.status(400).json({ message: 'Service ID is required' });
  }

  try {
    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const existingSubscription = await UserService.findOne({ user_id: userId, service_id });
    if (existingSubscription) {
      return res.status(400).json({ message: 'User is already subscribed to this service' });
    }

    const newSubscription = new UserService({
      user_id: userId,
      service_id: service._id,
    });

    await newSubscription.save();
    return res.status(201).json({ message: 'Subscribed successfully', subscription: newSubscription });
  } catch (err) {
    console.error('Error subscribing to service:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get("/subscribed-services", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const subscribedServices = await UserService.find({ user_id: userId })
      .populate('service_id');

    if (subscribedServices.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(subscribedServices);
  } catch (err) {
    console.error('Error fetching subscribed services:', err);
    res.status(500).send('Server error');
  }
});

router.post("/unsubscribe", verifyToken, async (req, res) => {
  const { service_id } = req.body;
  const userId = req.user.id;

  try {
    const subscription = await UserService.findOneAndDelete({ user_id: userId, service_id });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    return res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error('Error unsubscribing from service:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;