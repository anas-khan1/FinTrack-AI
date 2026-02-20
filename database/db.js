const Datastore = require('nedb-promises');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'data');

const users = Datastore.create({ filename: path.join(dbDir, 'users.db'), autoload: true });
const expenses = Datastore.create({ filename: path.join(dbDir, 'expenses.db'), autoload: true });
const income = Datastore.create({ filename: path.join(dbDir, 'income.db'), autoload: true });
const budgets = Datastore.create({ filename: path.join(dbDir, 'budgets.db'), autoload: true });

// Create indexes
users.ensureIndex({ fieldName: 'email', unique: true });
expenses.ensureIndex({ fieldName: 'user_id' });
expenses.ensureIndex({ fieldName: 'date' });
income.ensureIndex({ fieldName: 'user_id' });
budgets.ensureIndex({ fieldName: 'user_id' });

module.exports = { users, expenses, income, budgets };
