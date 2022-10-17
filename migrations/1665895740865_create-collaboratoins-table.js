/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // membuat tabel collaborations
  pgm.createTable('collaborations', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    note_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  /*
    menambahkan constraint UNIQUE, kombinasi dari kolom note_id dan user_id.
    Guna menghndari dulikasi data antara nilai keduanyan.
   */
  pgm.addConstraint('collaborations', 'unique_note_id_and_uesr_id', 'UNIQUE(note_id, user_id)');

  // memberikan constraint foreign key pada kolom note_id dan user_id terhadap notes.id dan users.id
  pgm.addConstraint('collaborations', 'fk_collaborations.note_id_notes_id', 'FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE');
  pgm.addConstraint('collaborations', 'fk_collaborations.user_id_users_id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  // menghapus tabel collaborations
  pgm.dropTable('collaborations');
};
