import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'db_aas',
})

export default db;