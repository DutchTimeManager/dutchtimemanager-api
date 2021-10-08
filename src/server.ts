import express from 'express';
import mysql from 'mysql2';
import { Responses } from './utils';
import config from './config';

const app = express();
const port = 4000;

// Setup the database connection
const pool: mysql.Pool = mysql.createPool({
	host: config.db.host,
	user: config.db.user,
	password: config.db.password,
	database: config.db.database,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

Responses.setup(pool, {
	id: config.google.clientID,
	secret: config.google.clientSecret,
	redirURL: config.google.redirURL,
});

// Status check of API server
app.get('/', (req, res) => Responses.statusCheck(req, res));

// Oauth2 time!!!
app.get('/oauthlogin/start', (req, res) => Responses.startOAuth2(req, res));
app.get('/oauthlogin/catch', (req, res) => Responses.catchOAuth2(req, res));

// Catch all other requests and responds 404
app.all('/*', (req, res) => Responses.notFoundRequest(req, res));

// Start server
app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

export { config };
