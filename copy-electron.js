const fs = require('fs');
const path = require('path');

// Paths for electron.js
const electronSource = path.join(__dirname, 'public', 'electron.js');
const electronTarget = path.join(__dirname, 'build', 'electron.js');

// Paths for database.js
const databaseSource = path.join(__dirname, 'public', 'database.js');
const databaseTarget = path.join(__dirname, 'build', 'database.js');

// Copy electron.js
fs.copyFileSync(electronSource, electronTarget);
console.log('Copied electron.js to build directory');

// Copy database.js
fs.copyFileSync(databaseSource, databaseTarget);
console.log('Copied database.js to build directory');