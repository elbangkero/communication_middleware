const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const cron = require('node-cron');

const folderPath = '../logs'; // Current directory where the index.js file is located

// Weekly cron job to zip files every Sunday at midnight (0:00)
cron.schedule('* * * * *', () => {
  zipWeeklyFiles();
});

// Monthly cron job to zip files on the 1st day of every month at midnight (0:00)
cron.schedule('*/5 * * * *', () => {
  zipMonthlyFiles();
});

function zipWeeklyFiles() {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    files = files.filter((file) => {
      const filePath = path.join(folderPath, file);
      return fs.statSync(filePath).isFile();
    });

    const fileGroups = [];
    while (files.length > 0) {
      fileGroups.push(files.splice(0, 7));
    }

    const weeklyZipFiles = [];

    fileGroups.forEach((group, week) => {
      const zipFileName = path.join(folderPath, `week${week + 1}.zip`);
      const output = fs.createWriteStream(zipFileName);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Set compression level
      });

      output.on('close', () => {
        console.log(`Week ${week + 1} ZIP file created: ${zipFileName}`);
        weeklyZipFiles.push(zipFileName);

        if (weeklyZipFiles.length === fileGroups.length) {
          // No need to create the monthly zip file here
          // It will be created by the monthly cron job
        }
      });

      archive.pipe(output);

      group.forEach((file) => {
        const filePath = path.join(folderPath, file);
        archive.file(filePath, { name: file });
      });

      archive.finalize();
    });

    console.log(`Total number of files in ${folderPath}: ${files.length}`);
  });
}

function zipMonthlyFiles() {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  const folderName = `${month}_${year}`;
  const zipFileName = path.join(folderPath, `${folderName}.zip`);
  const output = fs.createWriteStream(zipFileName);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Set compression level
  });

  output.on('close', () => {
    console.log(`Monthly ZIP file created: ${zipFileName}`);
  });

  archive.pipe(output);

  // Collect weekly zip files to include in the monthly zip
  const weeklyZipFiles = [];

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    files.forEach((file) => {
      if (file.startsWith('week')) {
        weeklyZipFiles.push(file);
      }
    });

    weeklyZipFiles.forEach((weeklyZipFile) => {
      const filePath = path.join(folderPath, weeklyZipFile);
      archive.file(filePath, { name: path.basename(weeklyZipFile) });
    });

    archive.finalize();
  });
}
