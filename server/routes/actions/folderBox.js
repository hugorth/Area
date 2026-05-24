const axios = require('axios');
const cron = require('node-cron');
const UserToken = require('../../models/UserToken');

const boxFolderId = '291079602008';
const githubRepo = 'Hugom78/AREA';
let job = null;

async function getBoxFolders(userId) {
  try {
    if (!userId) throw new Error("userId est manquant pour l'accès Box.");

    const userToken = await UserToken.findOne({ service: 'box', userId });
    if (!userToken) throw new Error("AccessToken pour Box non trouvé.");

    const response = await axios.get(`https://api.box.com/2.0/folders/${boxFolderId}/items`, {
      headers: { Authorization: `Bearer ${userToken.accessToken}` },
    });

    return response.data.entries.filter(entry => entry.type === 'folder');
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers de Box:', error.message);
    return [];
  }
}

async function getBoxFiles(folderId, userId) {
  try {
    if (!userId) throw new Error("userId est manquant pour l'accès Box.");

    const userToken = await UserToken.findOne({ service: 'box', userId });
    if (!userToken) throw new Error("AccessToken pour Box non trouvé.");

    const response = await axios.get(`https://api.box.com/2.0/folders/${folderId}/items`, {
      headers: { Authorization: `Bearer ${userToken.accessToken}` },
    });

    return response.data.entries.filter(entry => entry.type === 'file');
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers de Box:', error.message);
    return [];
  }
}

async function createFolderInGitHub(folderName, userId) {
  try {
    const userToken = await UserToken.findOne({ service: 'github', userId });
    if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");

    const response = await axios.put(
      `https://api.github.com/repos/${githubRepo}/contents/${folderName}/README.md`,
      {
        message: `Création du dossier ${folderName} avec README.md depuis Box`,
        content: Buffer.from('').toString('base64')
      },
      { headers: { Authorization: `Bearer ${userToken.accessToken}` } }
    );

    if (response.status === 201) {
      console.log(`Dossier ${folderName} créé avec succès dans le repo GitHub avec README.md.`);
    } else {
      console.error(`Échec de la création du dossier ${folderName}. Statut:`, response.status);
    }
  } catch (error) {
    console.error(`Erreur lors de la création du dossier ${folderName} sur GitHub:`, error.message);
  }
}

async function checkIfFolderExistsInGitHub(folderName, userId) {
    try {
      const userToken = await UserToken.findOne({ service: 'github', userId });
      if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");
  
      const response = await axios.get(
        `https://api.github.com/repos/${githubRepo}/contents/${folderName}`,
        { headers: { Authorization: `Bearer ${userToken.accessToken}` } }
      );
  
      return response.status === 200;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      } else {
        console.error(`Erreur lors de la vérification du dossier ${folderName} sur GitHub:`, error.message);
        return false;
      }
    }
  }
  
  async function checkIfFileExistsInGitHub(folderName, fileName, userId) {
    try {
      const userToken = await UserToken.findOne({ service: 'github', userId });
      if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");
  
      const response = await axios.get(
        `https://api.github.com/repos/${githubRepo}/contents/${folderName}/${fileName}`,
        { headers: { Authorization: `Bearer ${userToken.accessToken}` } }
      );
  
      return response.status === 200;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      } else {
        console.error(`Erreur lors de la vérification du fichier ${fileName} dans le dossier ${folderName} sur GitHub:`, error.message);
        return false;
      }
    }
  }
  
  async function createFolderInGitHub(folderName, userId) {
    try {
      const folderExists = await checkIfFolderExistsInGitHub(folderName, userId);
      if (folderExists) {
        console.log(`Le dossier ${folderName} existe déjà dans le dépôt GitHub.`);
        return;
      }
  
      const userToken = await UserToken.findOne({ service: 'github', userId });
      if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");
  
      const response = await axios.put(
        `https://api.github.com/repos/${githubRepo}/contents/${folderName}/README.md`,
        {
          message: `Création du dossier ${folderName} avec README.md depuis Box`,
          content: Buffer.from('').toString('base64')
        },
        { headers: { Authorization: `Bearer ${userToken.accessToken}` } }
      );
  
      if (response.status === 201) {
        console.log(`Dossier ${folderName} créé avec succès dans le repo GitHub avec README.md.`);
      } else {
        console.error(`Échec de la création du dossier ${folderName}. Statut:`, response.status);
      }
    } catch (error) {
      console.error(`Erreur lors de la création du dossier ${folderName} sur GitHub:`, error.message);
    }
  }
  
  async function uploadFileToGitHub(fileName, fileContent, folderName, userId) {
    try {
      const fileExists = await checkIfFileExistsInGitHub(folderName, fileName, userId);
      if (fileExists) {
        console.log(`Le fichier ${fileName} existe déjà dans le dossier ${folderName} sur GitHub.`);
        return;
      }
  
      const userToken = await UserToken.findOne({ service: 'github', userId });
      if (!userToken) throw new Error("AccessToken pour GitHub non trouvé.");
  
      const response = await axios.put(
        `https://api.github.com/repos/${githubRepo}/contents/${folderName}/${fileName}`,
        {
          message: `Ajout du fichier ${fileName} dans ${folderName} depuis Box`,
          content: Buffer.from(fileContent).toString('base64')
        },
        { headers: { Authorization: `Bearer ${userToken.accessToken}` } }
      );
  
      if (response.status === 201) {
        console.log(`Fichier ${fileName} ajouté avec succès dans le dossier ${folderName} sur GitHub.`);
      } else {
        console.error(`Échec de l'ajout du fichier ${fileName} dans ${folderName}. Statut:`, response.status);
      }
    } catch (error) {
      console.error(`Erreur lors de l'ajout du fichier ${fileName} dans ${folderName} sur GitHub:`, error.message);
    }
  }
  
  async function checkForFolders(userId) {
    if (!userId) {
      console.error("userId est manquant pour vérifier les dossiers.");
      return;
    }
  
    const folders = await getBoxFolders(userId);
    if (folders.length === 0) {
      console.log("Aucun dossier trouvé dans le dossier Box.");
      return;
    }
  
    for (const folder of folders) {
      await createFolderInGitHub(folder.name, userId);
  
      const files = await getBoxFiles(folder.id, userId);
      for (const file of files) {
        try {
          const userToken = await UserToken.findOne({ service: 'box', userId });
          const response = await axios.get(`https://api.box.com/2.0/files/${file.id}/content`, {
            headers: { Authorization: `Bearer ${userToken.accessToken}` },
            responseType: 'arraybuffer'
          });
  
          const fileContent = Buffer.from(response.data);
          await uploadFileToGitHub(file.name, fileContent.toString('base64'), folder.name, userId);
        } catch (error) {
          console.error(`Erreur lors de la récupération du fichier ${file.name} depuis Box:`, error.message);
        }
      }
    }
  }
  
async function checkForFolders(userId) {
  if (!userId) {
    console.error("userId est manquant pour vérifier les dossiers.");
    return;
  }

  const folders = await getBoxFolders(userId);
  if (folders.length === 0) {
    console.log("Aucun dossier trouvé dans le dossier Box.");
    return;
  }

  for (const folder of folders) {
    await createFolderInGitHub(folder.name, userId);

    const files = await getBoxFiles(folder.id, userId);
    for (const file of files) {
      try {
        const userToken = await UserToken.findOne({ service: 'box', userId });
        const response = await axios.get(`https://api.box.com/2.0/files/${file.id}/content`, {
          headers: { Authorization: `Bearer ${userToken.accessToken}` },
          responseType: 'arraybuffer'
        });

        const fileContent = Buffer.from(response.data);
        await uploadFileToGitHub(file.name, fileContent, folder.name, userId);
      } catch (error) {
        console.error(`Erreur lors de la récupération du fichier ${file.name} depuis Box:`, error.message);
      }
    }
  }
}

const runFolderBoxToGithubJob = (userId) => {
  if (!userId) {
    console.error("userId est requis pour démarrer le job Box to GitHub.");
    return;
  }
  if (!job) {
    job = cron.schedule('*/1 * * * *', async () => {
      console.log(`Vérification des dossiers dans Box pour l'utilisateur ${userId}...`);
      await checkForFolders(userId);
    });
    console.log('Box to GitHub cron job started.');
  } else {
    console.log('Box to GitHub cron job is already running.');
  }
};

const stopFolderBoxToGithubJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Box to GitHub cron job stopped.');
  } else {
    console.log('No Box to GitHub cron job to stop.');
  }
};

module.exports = {
  runFolderBoxToGithubJob,
  stopFolderBoxToGithubJob,
};
