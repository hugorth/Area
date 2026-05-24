const axios = require('axios');
const cron = require('node-cron');
const UserToken = require('../../models/UserToken');

const boxFolderId = '291079602008';
const githubRepo = 'Hugom78/AREA';
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

async function deleteReadmeFromGitHub(userId) {
  try {
    const userToken = await UserToken.findOne({ service: 'github', userId });
    if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");

    const readmeResponse = await axios.get(`https://api.github.com/repos/${githubRepo}/contents/README.md`, {
      headers: { Authorization: `Bearer ${userToken.accessToken}` },
    });

    const sha = readmeResponse.data.sha;

    await axios.delete(`https://api.github.com/repos/${githubRepo}/contents/README.md`, {
      headers: { Authorization: `Bearer ${userToken.accessToken}` },
      data: {
        message: "Suppression du fichier README.md avant mise à jour",
        sha: sha
      }
    });

    console.log("README.md supprimé avec succès dans le repo GitHub.");
  } catch (error) {
    console.error("Erreur lors de la suppression du README.md sur GitHub:", error.message);
  }
}

async function uploadReadmeToGitHub(readmeContent, userId) {
  try {
    const userToken = await UserToken.findOne({ service: 'github', userId });
    if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");

    const response = await axios.put(
      `https://api.github.com/repos/${githubRepo}/contents/README.md`,
      {
        message: "Mise à jour du fichier README depuis Box",
        content: Buffer.from(readmeContent).toString('base64')
      },
      { headers: { Authorization: `Bearer ${userToken.accessToken}` } }
    );

    if (response.status === 201 || response.status === 200) {
      console.log("README.md publié/mis à jour dans le repo GitHub.");
    } else {
      console.error("Échec de la mise à jour du README.md. Statut:", response.status);
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du README.md:", error.message);
  }
}

async function checkForReadmeFile(userId) {
  if (!userId) {
    console.error("userId est manquant pour vérifier le fichier README.");
    return;
  }

  const files = await getBoxFiles(userId);
  const readmeFile = files.find(file => file.name === 'README.md');

  if (readmeFile) {
    try {
      const userToken = await UserToken.findOne({ service: 'box', userId });
      const response = await axios.get(`https://api.box.com/2.0/files/${readmeFile.id}/content`, {
        headers: { Authorization: `Bearer ${userToken.accessToken}` },
      });

      const readmeContent = response.data;
      
      await deleteReadmeFromGitHub(userId);
      await uploadReadmeToGitHub(readmeContent, userId);
    } catch (error) {
      console.error("Erreur lors de la récupération du contenu du README.md:", error.message);
    }
  } else {
    console.log("Aucun README.md trouvé dans le dossier Box.");
  }
}

const runReadmeBoxToGithubJob = (userId) => {
  if (!userId) {
    console.error("userId est requis pour démarrer le job Box to GitHub.");
    return;
  }
  if (!job) {
    job = cron.schedule('*/1 * * * *', async () => {
      console.log(`Vérification du README.md dans Box pour l'utilisateur ${userId}...`);
      await checkForReadmeFile(userId);
    });
    console.log('Box to GitHub cron job started.');
  } else {
    console.log('Box to GitHub cron job is already running.');
  }
};

const stopReadmeBoxToGithubJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Box to GitHub cron job stopped.');
  } else {
    console.log('No Box to GitHub cron job to stop.');
  }
};

module.exports = {
  runReadmeBoxToGithubJob,
  stopReadmeBoxToGithubJob,
};
