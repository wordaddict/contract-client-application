const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Contract extends Model {}
    
    Contract.init({
        terms: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('new', 'in_progress', 'terminated')
        }
    }, {
        sequelize,
        modelName: 'Contract'
    });

    return Contract;
}; 