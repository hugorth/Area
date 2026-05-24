const cron = require('node-cron');
const axios = require('axios');
const UserToken = require('../models/UserToken');
const { refreshToken } = require('../routes/services/authService');
const ProcessedMessage = require('../models/ProcessedMessage');

const teamsWebhookUrl = 'https://epitechfr.webhook.office.com/webhookb2/251b7b0f-6e76-4e0a-8149-b86426a3b716@901cb4ca-b862-4029-9306-e5cd0f6d9f86/IncomingWebhook/1ebd6d34d0394b3c836a1a8f8fc1313f/c33eb7b7-f5dd-478e-99fd-e43c420b6341/V2W0SplajwXj-R0vAYB2so6WDZyl5dYORuchdR-JLe5vQ1';

let job = null;
/**
 * @function ContactCronJob
 * @description Initialise et planifie un travail cron qui s'exécute toutes les minutes. Ce travail vérifie les 50 derniers expéditeurs uniques pour les utilisateurs ayant des tokens Gmail. Il récupère les tokens d'accès mis à jour pour chaque utilisateur, puis utilise ces tokens pour interroger l'API Gmail et obtenir les messages récents.
 * 
 * @example
 * const ContactCronJob = require('./path/to/ContactsCronJob');
 * ContactCronJob();
 */
const ContactCronJob = () => {
  if (!job) {
    job = cron.schedule('*/1 * * * *', async () => {
      try {
        console.log('=== Démarrage du cron job : Vérification des 50 derniers expéditeurs uniques ===');
        
        const users = await UserToken.find({ service: 'gmail' });
        console.log(`Nombre d'utilisateurs trouvés avec des tokens Gmail: ${users.length}`);
    
        for (const user of users) {
          try {
            console.log(`\nTraitement de l'utilisateur : ${user.userId}`);
            
            const accessToken = await refreshToken('gmail', user.userId);
            console.log(`Token d'accès pour l'utilisateur ${user.userId}: ${accessToken}`);
    
            const emailResponse = await axios.get(`https://www.googleapis.com/gmail/v1/users/${user.userId}/messages`, {
              headers: { Authorization: `Bearer ${accessToken}` },
              params: { maxResults: 50 }
            });
    
            const messages = emailResponse.data.messages || [];
            console.log(`Messages trouvés pour l'utilisateur ${user.userId}: ${messages.length}`);
    
            const uniqueEmails = new Set();

            for (const message of messages) {
              const messageId = message.id;
              
              const alreadyProcessed = await ProcessedMessage.findOne({ messageId, userId: user.userId });
              if (alreadyProcessed) continue;

              const messageDetails = await axios.get(`https://www.googleapis.com/gmail/v1/users/${user.userId}/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              const headers = messageDetails.data.payload.headers;
              const fromHeader = headers.find(header => header.name === 'From');
              
              if (fromHeader && fromHeader.value) {
                const email = fromHeader.value;
                console.log(`E-mail trouvé: ${email}`);
                uniqueEmails.add(email);
              }
              
              await ProcessedMessage.create({ messageId, userId: user.userId });
            }

            const uniqueEmailList = Array.from(uniqueEmails).join(', ');
            const messagePayload = {
              text: `Voici la liste des adresses e-mail uniques des 50 derniers expéditeurs : ${uniqueEmailList}`,
            };

            await axios.post(teamsWebhookUrl, messagePayload);
            console.log('Notification envoyée à Teams avec la liste des e-mails uniques.');
            console.log (`Liste des adresses e-mail uniques des 50 derniers expéditeurs pour l'utilisateur ${user.userId}: ${uniqueEmailList}`);

          } catch (error) {
            console.error(`Erreur lors de la vérification pour l'utilisateur ${user.userId}:`, error.message);
          }
        }
        
        console.log('=== Cron job terminé ===\n');
      } catch (error) {
        console.error('Erreur pendant le cron job programmé:', error.message);
      }
    });
    console.log('Cron job démarré.');
  } else {
    console.log('Cron job déjà en cours d\'exécution.');
  }
};

const stopCronJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Cron job arrêté.');
  } else {
    console.log('Aucun cron job à arrêter.');
  }
};

module.exports = { ContactCronJob, stopCronJob };
