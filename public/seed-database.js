// Import required dependencies and models from your database.js
const {
  sequelize,
  Client,
  Stylist,
  Service,
  Sale,
  SaleItem,
  Inventory
} = require('./database');

// Export the function so it can be used in other files
module.exports = {
  seedDatabase
};

