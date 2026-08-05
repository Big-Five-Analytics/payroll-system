const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
    // Render (and most PaaS hosts) only capture stdout/stderr - the file transports
    // above write into the container's ephemeral filesystem, which is invisible in
    // Render's log viewer and wiped on every restart/redeploy. Console output is what
    // actually shows up there, so this needs to run in every environment, not just dev.
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.combine(winston.format.timestamp(), winston.format.json())
          : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

module.exports = logger;
