import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Enter your MySQL password if you have one
  database: 'normabeauti_db',
});