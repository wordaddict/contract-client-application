const { Profile } = require('../src/models');
const { sequelize } = require('../src/models');

async function seedAdmin() {
    try {
        // Sync all models with database
        await sequelize.sync();

        // Create admin profile
        const adminProfile = await Profile.create({
            firstName: 'Admin',
            lastName: 'User',
            profession: 'System Administrator',
            balance: 0,
            type: 'admin'
        });

        console.log('Admin user created successfully:');
        console.log('Profile ID:', adminProfile.id);
        console.log('Type:', adminProfile.type);
        
        await sequelize.close();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin(); 