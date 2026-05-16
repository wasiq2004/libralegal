const dotenv = require('dotenv');

dotenv.config();

const { importServicesFromStaticFiles } = require('../lib/services');

async function run() {
  try {
    const result = await importServicesFromStaticFiles({ overwriteExisting: false });
    console.log(`Imported service pages into MySQL.`);
    console.log(`Total static services found: ${result.totalStaticServices}`);
    console.log(`Inserted new rows: ${result.inserted}`);
    console.log(`Updated existing rows: ${result.updated}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to import service pages into MySQL.');
    console.error(error);
    process.exit(1);
  }
}

run();
