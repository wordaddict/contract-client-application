const env = process.env.NODE_ENV || 'development';

const config = {
    development: {
        storage: './database.sqlite3',
        dialect: 'sqlite'
    },
    test: {
        storage: ':memory:',
        dialect: 'sqlite',
        logging: false
    }
};

module.exports = config[env]; 