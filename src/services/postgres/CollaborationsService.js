/* eslint-disable linebreak-style */
/* eslint-disable no-underscore-dangle */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

class CollaborationsService {
  /*
  Bertanggung jawab dalam menangani pengelolaan data pada tabel collaborations
  yang merupakan transaksi dari relasi many-to-many dari tabel notes dan users.
  */
  constructor() {
    this._pool = new Pool();
  }

  /**
   * fungsi untuk menambahkan kolaborasi
   * @param {String}  noteId  id note milik owner
   * @param {String}  userId  id user yang diajak berkolaborasi
   * @return  {String}  id colaborasi
   */
  async addCollaboration(noteId, userId) {
    const id = `collab-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id',
      values: [id, noteId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  /**
   * fungsi untuk menghapus kolaborasi
   * @param {String}  noteId  id note milik owner
   * @param {String}  userId  id user yang diajak berkolaborasi
   * @return  {null}  mengembalikan InvariantError jika gagal
   */
  async deleteCollaboration(noteId, userId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE note_id = $1 AND user_id = $2 RETURNING id',
      values: [noteId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal dihapus');
    }
  }

  /**
   * fungsi untuk memverifikasi kolaborasi
   * @param {String}  noteId  id note milik owner
   * @param {String}  userId  id user yang diajak berkolaborasi
   * @return  {null}  mengembalikan InvariantError jika gagal
   */
  async verifyCollaborator(noteId, userId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE note_id = $1 AND user_id = $2',
      values: [noteId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal diverifikasi');
    }
  }
}

module.exports = CollaborationsService;
