const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const UserToken = require('../../models/UserToken');

const boxFolderId = '291079602008';
const githubRepo = 'Hugom78/AREA';
const processedFilesPath = path.join(__dirname, 'processedFiles.json');
let job = null;

function loadProcessedFiles() {
  if (fs.existsSync(processedFilesPath)) {
    const data = fs.readFileSync(processedFilesPath, 'utf8');
    return new Set(JSON.parse(data));
  }
  return new Set();
}

function saveProcessedFiles(processedFiles) {
  fs.writeFileSync(processedFilesPath, JSON.stringify(Array.from(processedFiles)), 'utf8');
}

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

async function createGitHubIssue(file, userId, action) {
  try {
    if (!userId) throw new Error("userId est manquant pour GitHub.");

    const userToken = await UserToken.findOne({ service: 'github', userId });
    if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");

    let issueTitle, issueBody;

    if (action === 'added' || action === 'updated') {
      issueTitle = `Fichier ${action === 'added' ? 'ajouté' : 'mis à jour'} : ${file.name}`;
      issueBody = `Le fichier [${file.name}](${file.url}) a été ${action === 'added' ? 'ajouté' : 'mis à jour'} dans le dossier Box.`;
    } else if (action === 'deleted') {
      issueTitle = `Fichier supprimé : ${file.name}`;
      issueBody = `Le fichier ${file.name} a été supprimé du dossier Box.`;
    } else {
      throw new Error(`Action invalide : ${action}`);
    }

    const response = await axios.post(
      `https://api.github.com/repos/${githubRepo}/issues`,
      { title: issueTitle, body: issueBody },
      { headers: { Authorization: `Bearer ${userToken.accessToken}` } }
    );

    if (response.status === 201) {
      console.log(`Issue GitHub créée pour le fichier: ${file.name}`);
    } else {
      console.error("Échec de la création de l'issue. Statut:", response.status);
    }
  } catch (error) {
    console.error(`Erreur lors de la création de l'issue GitHub pour le fichier ${file.name}:`, error.message);
  }
}

async function checkForNewOrUpdatedFiles(userId) {
  if (!userId) {
    console.error("userId est manquant pour vérifier les nouveaux fichiers.");
    return;
  }

  const processedFiles = loadProcessedFiles();
  const currentFiles = await getBoxFiles(userId);
  const currentFileNames = new Set(currentFiles.map(file => file.name));

  const newFiles = currentFiles.filter(file => !processedFiles.has(file.name));

  const deletedFiles = Array.from(processedFiles).filter(fileName => !currentFileNames.has(fileName));

  for (const file of newFiles) {
    await createGitHubIssue(file, userId, 'added');
    processedFiles.add(file.name);
  }

  for (const fileName of deletedFiles) {
    await createGitHubIssue({ name: fileName, url: null }, userId, 'deleted');
    processedFiles.delete(fileName);
  }

  saveProcessedFiles(processedFiles);
}

const runDeletedFilesBoxToGithubJob = (userId) => {
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

const stopDeletedFileBoxToGithubJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Box to GitHub cron job stopped.');
  } else {
    console.log('No Box to GitHub cron job to stop.');
  }
};

module.exports = {
  runDeletedFilesBoxToGithubJob,
  stopDeletedFileBoxToGithubJob,
};
