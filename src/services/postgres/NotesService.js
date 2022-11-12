/* eslint-disable linebreak-style */
/* eslint-disable no-underscore-dangle */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { mapDBToModel } = require('../../utils');

class NotesService {
  constructor(collaborationsService, cacheService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addNote({
    title, body, tags, owner,
  }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO notes VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, body, tags, createdAt, updatedAt, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Catatan gagal ditambahkan');
    }

    await this._cacheService.delete(`notes:${owner}`);
    return result.rows[0].id;
  }

  async getNotes(owner) {
    try {
      const result = await this._cacheService.get(`notes:${owner}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: `SELECT notes.* FROM notes
      LEFT JOIN collaborations ON collaborations.note_id = notes.id
      WHERE notes.owner = $1 OR collaborations.user_id = $1
      GROUP BY notes.id`,
        values: [owner],
      };

      const result = await this._pool.query(query);
      const mappedResult = result.rows.map(mapDBToModel);

      await this._cacheService.set(`notes:${owner}`, JSON.stringify(mappedResult));

      return mappedResult;
    }
  }

  async getNoteById(id) {
    const query = {
      text: `SELECT notes.*, users.username
      FROM notes
      LEFT JOIN users ON users.id = notes.owner
      WHERE notes.id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Catatan tidak ditemukan');
    }

    return result.rows.map(mapDBToModel)[0];
  }

  async editNoteById(id, { title, body, tags }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id',
      values: [title, body, tags, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
    }

    const { owner } = result.rows[0];
    await this._cacheService.delete(`notes:${owner}`);
  }

  async deleteNoteById(id) {
    const query = {
      text: 'DELETE FROM notes WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }

    const { owner } = result.rows[0];
    await this._cacheService.delete(`notes:${owner}`);
  }

  /**
   * fungsi untuk memverifikasi kepemilikan note
   * @param {String} id id note
   * @param {String} owner id owner
   * @return {null} mengembalikan NotFoundError jika note tidak ditemukan,
   * mengembalikan AuthorizationError jika note bukan milik owner
   */
  async verifyNoteOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM notes WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Catatan tidak ditemukan');
    }

    const note = result.rows[0];

    if (note.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  /**
   * fungsi untuk memverifikasi pengaksesan note
   * @param {Sting} noteId id note milik owner
   * @param {String} userId id user baik itu owner atau colaborator
   * @return {null} mengembalikan NotFoundError atau AuthorizationError
   */
  async verifyNoteAccess(noteId, userId) {
    /*
    - Fungsi ini akan memeriksa hak akses userId terhadap noteId melalui fungsi verifyNoteOwner.
    - Bila userId tersebut merupakan owner dari noteId maka ia akan lolos verifikasi.
    - Namun bila gagal, proses verifikasi owner membangkitkan eror (gagal) dan masuk ke block catch.
    - Dalam block catch (pertama), error yang dibangkitkan dari fungsi verifyNoteOwner bisa berupa
      NotFoundError atau AuthorizationError.
    - Bila error merupakan NotFoundError, maka langsung throw dengan error (NotFoundError) tersebut.
      Kita tak perlu memeriksa hak akses kolaborator karena catatannya memang tidak ada.
    - Bila AuthorizationError, maka lanjutkan dengan proses pemeriksaan hak akses kolaborator,
      menggunakan fungsi verifyCollaborator.
    - Bila pengguna seorang kolaborator, proses verifikasi akan lolos.
    - Namun jika bukan, maka fungsi verifyNoteAccess gagal dan throw kembali
      error (AuthorizationError).
     */
    try {
      await this.verifyNoteOwner(noteId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationsService.verifyCollaborator(noteId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = NotesService;
