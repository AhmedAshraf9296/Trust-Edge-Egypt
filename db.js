// db.js

const { Sequelize, DataTypes } = require('sequelize');

// Use an SQLite database (you can adjust the connection string based on your setup)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// Define the User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password:{
    type:DataTypes.STRING,
    allowNull:false,
  }
});

// Define the Message model
const Message = sequelize.define('Message', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
const Room = sequelize.define('Room', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  Message.belongsTo(Room)
  Room.hasMany(Message)
//   User.belongsTo(Room);

// Sync the models with the database
// sequelize.sync({ force: false }).then(() => {
//   console.log('Database and tables synced');
// });

module.exports = { User, Message ,Room};