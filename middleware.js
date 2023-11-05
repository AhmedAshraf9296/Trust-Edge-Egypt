// middleware.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');


const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 messages per minute
  message: 'Too many messages, please try again later.',
});
let secretKey ;
function authenticateUser(req, res, next) {
    const token = req.headers.authorization;
  console.log('tokentokentokentokentokentokentokentoken',token)
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      req.userId = decoded.userId;
      next();
    });
  }
  const generateSecretKey = () => {
    secretKey =  crypto.randomBytes(32).toString('hex');
    return secretKey;
  };
  

module.exports = {
  authenticateUser,
  generateSecretKey,
  messageLimiter
};
