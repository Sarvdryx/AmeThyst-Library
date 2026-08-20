import pool from '../config/postgres.mjs';

const getUserById = async (userId) => {
  const result = await pool.query(
    `SELECT 
       user_id AS "userId", 
       email, 
       username, 
       phone_number AS "phoneNumber", 
       avatar, 
       role, 
       borrow_num AS "borrowNum", 
       occupation, 
       birth_date AS "birthDate", 
       gender, 
       hometown, 
       description, 
       (password_hash = 'GOOGLE_AUTH') AS "isGoogleAccount" 
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const getUserWithPassword = async (userId) => {
  const result = await pool.query(
    'SELECT user_id, email, username, gender, phone_number, avatar, role, password_hash FROM users WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

const USER_FIELD_MAP = {
  username: 'username',
  phoneNumber: 'phone_number',
  occupation: 'occupation',
  birthDate: 'birth_date',
  gender: 'gender',
  hometown: 'hometown',
  description: 'description',
  avatar: 'avatar',
};

const updateUser = async (userId, fields) => {
  const setClauses = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && USER_FIELD_MAP[key]) {
      setClauses.push(`${USER_FIELD_MAP[key]} = $${index}`);
      values.push(value);
      index++;
    }
  }

  if (setClauses.length === 0) {
    return getUserById(userId);
  }

  values.push(userId);
  const query = `
    UPDATE users 
    SET ${setClauses.join(', ')}
    WHERE user_id = $${index}
    RETURNING 
      user_id AS "userId", 
      email, 
      username, 
      phone_number AS "phoneNumber", 
      avatar, 
      role,
      borrow_num AS "borrowNum",
      occupation,
      birth_date AS "birthDate",
      gender,
      hometown,
      description
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updatePassword = async (userId, passwordHash) => {
  await pool.query(
    `UPDATE users
     SET password_hash = $1, must_change_password = false, token_version = token_version + 1
     WHERE user_id = $2`,
    [passwordHash, userId]
  );
};

export { getUserById, getUserWithPassword, updateUser, updatePassword };
