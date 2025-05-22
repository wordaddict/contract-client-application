# Database Documentation

## Overview

The application uses SQLite as the database with Sequelize ORM. The database is file-based in development and in-memory for testing.

## Models

### Profile

```javascript
{
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profession: {
    type: DataTypes.STRING,
    allowNull: false
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2)
  },
  type: {
    type: DataTypes.ENUM('client', 'contractor', 'admin')
  }
}
```

### Contract

```javascript
{
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  terms: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('new', 'in_progress', 'terminated')
  },
  ClientId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Profiles',
      key: 'id'
    }
  },
  ContractorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Profiles',
      key: 'id'
    }
  }
}
```

### Job

```javascript
{
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paymentDate: {
    type: DataTypes.DATE
  },
  ContractId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Contracts',
      key: 'id'
    }
  }
}
```

## Relationships

1. **Profile - Contract (Client)**
   - One-to-Many relationship
   - A client can have multiple contracts
   - A contract belongs to one client

2. **Profile - Contract (Contractor)**
   - One-to-Many relationship
   - A contractor can have multiple contracts
   - A contract belongs to one contractor

3. **Contract - Job**
   - One-to-Many relationship
   - A contract can have multiple jobs
   - A job belongs to one contract

## Indexes

1. **Profile**
   - Primary key on `id`
   - Index on `type` for filtering by user type

2. **Contract**
   - Primary key on `id`
   - Foreign key indexes on `ClientId` and `ContractorId`
   - Index on `status` for filtering active contracts

3. **Job**
   - Primary key on `id`
   - Foreign key index on `ContractId`
   - Index on `paid` for filtering unpaid jobs
   - Index on `paymentDate` for date range queries

## Migrations

### Adding Admin Type
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Profiles', 'type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Profiles', 'type', {
      type: Sequelize.ENUM('client', 'contractor', 'admin'),
      allowNull: false
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Profiles', 'type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Profiles', 'type', {
      type: Sequelize.ENUM('client', 'contractor'),
      allowNull: false
    });
  }
};
```

## Seeding

### Admin User
```javascript
const adminProfile = await Profile.create({
  firstName: 'Admin',
  lastName: 'User',
  profession: 'System Administrator',
  balance: 0,
  type: 'admin'
});
```

### Sample Data
The application includes seed data for:
- Multiple clients and contractors
- Various contracts in different states
- Jobs with different payment statuses

## Database Configuration

### Development
```javascript
{
  storage: './database.sqlite3',
  dialect: 'sqlite'
}
```

### Test
```javascript
{
  storage: ':memory:',
  dialect: 'sqlite',
  logging: false
}
```

## Query Optimization

1. **Eager Loading**
   - Use `include` to load related data in a single query
   - Specify only needed attributes to reduce data transfer

2. **Pagination**
   - Use `limit` and `offset` for large result sets
   - Default limit of 2 for best clients endpoint

3. **Aggregation**
   - Use `SUM` for calculating total earnings
   - Group by profession for best profession endpoint

## Transactions

Transactions are used for:
1. Job payments (updating client and contractor balances)
2. Balance deposits (validating and updating balance)

## Backup and Recovery

1. **Development**
   - SQLite file is backed up regularly
   - Can be restored from backup file

2. **Testing**
   - In-memory database is recreated for each test
   - Seed data is loaded before tests

## Performance Considerations

1. **Indexing**
   - Appropriate indexes for frequently queried fields
   - Composite indexes for common query patterns

2. **Query Optimization**
   - Use of raw queries for complex aggregations
   - Efficient joins and includes

3. **Caching**
   - Cache frequently accessed data
   - Cache invalidation on updates

## Security

1. **SQL Injection Prevention**
   - Use of Sequelize ORM
   - Parameterized queries
   - Input validation

2. **Data Access Control**
   - Row-level security through application logic
   - User type-based access control

## Monitoring

1. **Query Performance**
   - Log slow queries
   - Monitor query execution time

2. **Database Size**
   - Monitor database file size
   - Implement cleanup routines if needed 