/* eslint-disable linebreak-style */
/* eslint-disable no-underscore-dangle */
const ClientError = require('../../exceptions/ClientError');

class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler = this.deleteAuthenticationHandler.bind(this);
  }

  async postAuthenticationHandler(request, h) {
    // mebuat access token dan refresh token ketika login dengan melampirkan username dan passowrd
    // menyimpan refresh token kedalam database
    try {
      // TODO: validasi payload
      this._validator.validatePostAuthenticationPayload(request.payload);

      // TODO: periksa kredensial user
      const { username, password } = request.payload;
      const id = await this._usersService.verifyUserCredential(username, password);

      // TODO: buat access token dan refresh token
      const accessToken = this._tokenManager.generateAccessToken({ id });
      const refreshToken = this._tokenManager.generateRefreshToken({ id });

      // TODO: simpan refresh token ke database
      await this._authenticationsService.addRefreshToken(refreshToken);

      // TODO: kirim response yang membawa access token dan refresh token
      const response = h.response({
        status: 'success',
        message: 'Authentication berhasil ditambahkan',
        data: {
          accessToken,
          refreshToken,
        },
      }).code(201);
      return response;
    } catch (error) {
      // TODO: kirim error akibat kesalahan masukan oleh client
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        }).code(error.statusCode);
        return response;
      }

      // TODO: kirim error akibat kesalahan bisnis logic / server
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      }).code(500);
      console.log(error);
      return response;
    }
  }

  async putAuthenticationHandler(request, h) {
    // memperbarui access token dengan melampirkan refresh token
    try {
      // TODO: validasi refresh token
      this._validator.validatePutAuthenticationPayload(request.payload);

      // TODO: verifikasi refresh token pada database
      const { refreshToken } = request.payload;
      await this._authenticationsService.verifyRefreshToken(refreshToken);

      // TODO: verifikasi signature token
      const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

      // TODO: buat access token baru
      const accessToken = this._tokenManager.generateAccessToken({ id });

      // TODO: kirim response body dengan data access token baru
      return {
        status: 'success',
        message: 'Access Token berhasil diperbarui',
        data: {
          accessToken,
        },
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        }).code(error.statusCode);
        return response;
      }

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      }).code(500);
      console.log(error);
      return response;
    }
  }

  async deleteAuthenticationHandler(request, h) {
    // menghapus refresh token yang dimiliki user pada database
    try {
      // TODO: validasi refresh token
      this._validator.validateDeleteAuthenticationPayload(request.payload);

      // TODO: cek ada atau tidak refresh token didalam database
      const { refreshToken } = request.payload;
      await this._authenticationsService.verifyRefreshToken(refreshToken);

      // TODO: hapus refresh token dari database
      await this._authenticationsService.deleteRefreshToken(refreshToken);

      // TODO: kirim response body
      return {
        status: 'success',
        message: 'Refresh token berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        }).code(error.statusCode);
        return response;
      }

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      }).code(500);
      console.log(error);
      return response;
    }
  }
}

module.exports = AuthenticationsHandler;
