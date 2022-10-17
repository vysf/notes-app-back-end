/* eslint-disable linebreak-style */
/* eslint-disable no-underscore-dangle */
const ClientError = require('../../exceptions/ClientError');

class CollaborationsHandler {
  constructor(collaborationsService, notesService, validator) {
    this._collaborationsService = collaborationsService;
    this._notesService = notesService;
    this._validator = validator;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    try {
      // TODO: validasi payload yang membawa noteId (id notes milik owner)
      // dan userId (id akun kolaborator)
      this._validator.validateCollaborationPayload(request.payload);

      // TODO: verifikasi owner catatan
      // hanya owner (credentialId) yang dapat menambahkan kolaborator
      const { id: credentialId } = request.auth.credentials;
      const { noteId, userId } = request.payload;

      await this._notesService.verifyNoteOwner(noteId, credentialId);

      // TODO: tambahkan kolaborasi pada catatan yang diminta
      const collaborationId = await this._collaborationsService.addCollaboration(noteId, userId);

      // TODO: kirim response body berhasil
      const response = h.response({
        status: 'success',
        message: 'Kolaborasi berhasil ditambahkan',
        data: {
          collaborationId,
        },
      }).code(201);
      return response;
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
        message: 'Maaf, terjadi kegagalanpada server kami.',
      }).code(500);

      console.error(error);
      return response;
    }
  }

  async deleteCollaborationHandler(request, h) {
    try {
      // TODO: validasi payload yang membawa noteId (id notes milik owner)
      // dan userId (id akun kolaborator)
      this._validator.validateCollaborationPayload(request.payload);

      // TODO: verifikasi owner catatan
      // hanya owner (credentialId) yang dapat menambahkan kolaborator
      const { id: credentialId } = request.auth.credentials;
      const { noteId, userId } = request.payload;

      await this._notesService.verifyNoteOwner(noteId, credentialId);

      // TODO: hapus kolaborasi pada catatan yang diminta
      await this._collaborationsService.deleteCollaboration(noteId, userId);

      return {
        status: 'success',
        message: 'Kolaborasi berhasil dihapus',
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
        message: 'Maaf, terjadi kegagalanpada server kami.',
      }).code(500);

      console.error(error);
      return response;
    }
  }
}

module.exports = CollaborationsHandler;
