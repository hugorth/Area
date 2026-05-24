const axios = require('axios');
const cron = require('node-cron');
const { refreshToken } = require('../services/authService');
const UserToken = require('../../models/UserToken');

const boxFolderId = '291079602008';
const githubRepo = 'Hugom78/AREA';
let processedFiles = new Set();
let job = null;

async function getBoxFiles(userId) {
  try {
    if (!userId) throw new Error("userId est manquant pour l'accès Box.");

    const userToken = await UserToken.findOne({ service: 'box', userId });
    if (!userToken) throw new Error("AccessToken pour Box non trouvé.");

    const response = await axios.get(`https://api.box.com/2.0/folders/${boxFolderId}/items`, {
      headers: { Authorization: `Bearer ${userToken.accessToken}` },
    });

    return response.data.entries.filter(entry => entry.type === 'file');
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers de Box:', error.message);
    return [];
  }
}

async function createGitHubIssue(file, userId) {
  try {
    if (!userId) throw new Error("userId est manquant pour GitHub.");

    const userToken = await UserToken.findOne({ service: 'github', userId });
    if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");

    const issueTitle = `Nouveau fichier ajouté/mis à jour : ${file.name}`;
    const issueBody = `Le fichier [${file.name}](${file.url}) a été ajouté ou mis à jour dans le dossier Box.`;

    const response = await axios.post(
      `https://api.github.com/repos/${githubRepo}/issues`,
      { title: issueTitle, body: issueBody },
      { headers: { Authorization: `Bearer ${userToken.accessToken}` } }
    );

    if (response.status === 201) {
      console.log(`Issue GitHub créée pour le fichier: ${file.name}`);
      console.log("Détails de l'issue:", response.data);
    } else {
      console.error("Échec de la création de l'issue. Statut:", response.status);
    }
  } catch (error) {
    if (error.response) {
      console.error(`Erreur lors de la création de l'issue GitHub pour le fichier ${file.name}:`, error.response.status);
      console.error("En-têtes de la réponse:", error.response.headers);
      console.error("Données de la réponse:", error.response.data);
    } else {
      console.error(`Erreur lors de la configuration de la requête pour le fichier ${file.name}:`, error.message);
    }
    console.error("Erreur complète:", error);
  }
}

async function checkForNewOrUpdatedFiles(userId) {
  if (!userId) {
    console.error("userId est manquant pour vérifier les nouveaux fichiers.");
    return;
  }
  const files = await getBoxFiles(userId);
  for (const file of files) {
    if (!processedFiles.has(file.id)) {
      await createGitHubIssue(file, userId);
      processedFiles.add(file.id);
    }
  }
}

const runBoxToGithubJob = (userId) => {
  if (!userId) {
    console.error("userId est requis pour démarrer le job Box to GitHub.");
    return;
  }
  if (!job) {
    job = cron.schedule('*/1 * * * *', async () => {
      console.log(`Vérification des nouveaux fichiers dans Box pour l'utilisateur ${userId}...`);
      await checkForNewOrUpdatedFiles(userId);
    });
    console.log('Box to GitHub cron job started.');
  } else {
    console.log('Box to GitHub cron job is already running.');
  }
};

const stopBoxToGithubJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Box to GitHub cron job stopped.');
  } else {
    console.log('No Box to GitHub cron job to stop.');
  }
};

module.exports = {
  runBoxToGithubJob,
  stopBoxToGithubJob,
};
