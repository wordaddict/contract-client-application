'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, we need to modify the column to allow NULL temporarily
    await queryInterface.changeColumn('Profiles', 'type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Then update it back to ENUM with the new value
    await queryInterface.changeColumn('Profiles', 'type', {
      type: Sequelize.ENUM('client', 'contractor', 'admin'),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // First, we need to modify the column to allow NULL temporarily
    await queryInterface.changeColumn('Profiles', 'type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Then update it back to ENUM without 'admin'
    await queryInterface.changeColumn('Profiles', 'type', {
      type: Sequelize.ENUM('client', 'contractor'),
      allowNull: false
    });
  }
}; 