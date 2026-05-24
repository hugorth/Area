const mongoose = require('mongoose');
const Service = require('../../models/Service');
const config = require('../../config/config');

const defaultServices = [
  { name: 'Gmail', description: 'Google email service' },
  { name: 'Teams', description: 'Microsoft collaboration service' },
  { name: 'DropBox', description: 'Dropbox service' },
  { name: 'Github', description: 'GitHub service' },
  { name: 'Spotify', description: 'Spotify service' },
  { name: 'X', description: 'X service' },
  { name: 'Discord', description: 'Discord service' },
  { name: 'Box', description: 'Box service' },
];

const seedServices = async () => {
  try {
    for (const service of defaultServices) {
      const existingService = await Service.findOne({ name: service.name });
      if (!existingService) {
        console.log(`Service ${service.name} not found, adding...`);
        await Service.create(service);
      } else {
        console.log(`Service ${service.name} already exists, skipping...`);
      }
    }
    console.log('Service seeding completed.');
  } catch (error) {
    console.error('Error seeding services:', error);
  }
};

module.exports = seedServices;
