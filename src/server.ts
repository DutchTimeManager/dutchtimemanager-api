import express from 'express';
import mysql from 'mysql2';
import { Responses } from './utils'

const app = express();
const port = 4000;

const config: {host: string, user: string, password: string, database: string} = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dutchtimemanager',
};


const pool:mysql.Pool = mysql.createPool({
  host: config.host,
  user: config.user,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Status check of API server
app.get('/', (req, res) => Responses.statusCheck(req, res));

// Catch all other requests and responds 404
app.all('/*', (req, res) => Responses.notFoundRequest(req, res));

// Oauth2 time!!!


// Start server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
