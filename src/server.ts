import express from 'express';
import Db from 'mysql2-async';
import Responses from './responses';
import Utils from './utils';
// import { config } from './config';
import YAML from 'js-yaml';
import fs from 'fs';
import { Config } from './types';


// Load config
const config: Config = YAML.load(fs.readFileSync('./config.yaml', 'utf8'), {schema: YAML.CORE_SCHEMA}) as Config;

const app = express();
const port = config.server.port;
const version = '0.0.1';





// Setup the database connection
const pool: Db = new Db({
	host: config.db.host,
	user: config.db.user,
	password: config.db.password,
	database: config.db.database,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

Responses.setup({
	id: config.google.clientID,
	secret: config.google.clientSecret,
	redirURL: config.google.redirURL,
});

Utils.setup(pool);


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

export { version, config};
