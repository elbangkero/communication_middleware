const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const tar = require('tar'); // Import the entire tar module

const folderPath = '../uploads/data_leads'; // Specify the path to your folder here

function archiveAndDeleteFiles() {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading folder:', err);
      return;
    }

    // Filter out .tar files
    const nonTarFiles = files.filter(file => !file.endsWith('.tar'));

    // If there are no non-tar files, do nothing
    if (nonTarFiles.length === 0) {
      //console.log('No files to archive.');
      return;
    }

    let filesToDelete = nonTarFiles.slice(0, 10); // Take only the first 10 files

    // Create the tar file
    const tarFileName = `archive_${Date.now()}.tar`;
    const tarFilePath = path.join(folderPath, tarFileName);

    tar.create({
      file: tarFilePath,
      cwd: folderPath
    }, filesToDelete)
      .then(() => {
        console.log(`Tar file ${tarFileName} created successfully.`);

        // Delete original files
        filesToDelete.forEach((file) => {
          fs.unlink(path.join(folderPath, file), (err) => {
            if (err) {
              fs.rmdir(err.path, { recursive: true }, (err) => {
                if (err) {
                  console.error('Error deleting folder:', err);
                  return;
                }
                //console.log('Folder deleted successfully.');
              });
              return;
            }
            //console.log(`Deleted file: ${file}`);
          });
        });
      })
      .catch((err) => {
        console.error('Error creating tar file:', err);
      });
  });
}

// Schedule the cron job
cron.schedule('0 */3 * * *', () => {
  //console.log('Starting archiving process...');
  archiveAndDeleteFiles();
});
