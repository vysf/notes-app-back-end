/* eslint-disable linebreak-style */
const ClientError = require('./ClientError');

// NotFoundError (extends dari ClientError) : Custom error yang mengindikasikan
// eror karena resource yang diminta client tidak ditemukan.
class NotFoundError extends ClientError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

module.exports = NotFoundError;
