import express from 'express';
import Db from 'mysql2-async';
import Responses from './responses.js';
import Utils from './utils/utils.js';
import fs from 'fs';
import yargs from 'yargs';
import rateLimit from 'express-rate-limit';


// Load package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

// Parse command line arguments
const argv = yargs(process.argv.slice(2)).options({
	'config': {
		alias: 'c', 
		type: 'string',
		default: 'config.yaml',
		normalize: true,
		description: 'Path to config file'
	},
	'help': {
		alias: 'h',
		type: 'boolean',
		description: 'Print help and exit',
		help: true
	}
}).parseSync();

// Load config
console.info('Loading config from ' + argv['config'] );
const config = await Utils.loadConfig(argv['config']);
// console.log(config);

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

Responses.setup();
Utils.setup(pool);

// Set up express
const app = express();
const limiter = rateLimit({
	windowMs: 1*60*1000,
	max: 20,
	// onLimitReached:
});

app.use(limiter);

app.use(function(req, res){
	const origin = req.header('Origin');
	res.header('Vary', 'Origin');
	res.header('Access-Control-Allow-Origin', origin);
	res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, X-dtm-token');
	res.sendStatus(200);
});
 
// Status check of API server
app.get('/', (req, res) => Responses.statusCheck(req, res));

// Oauth2 time!!!
app.get('/oauthlogin/start', (req, res) => Responses.startOAuth2(req, res));
app.get('/oauthlogin/catch', (req, res) => Responses.catchOAuth2(req, res));

// User endpoint
app.get('/user/fromid', (req, res) => Responses.getUserFromId(req, res));
app.get('/user/fromtoken', (req, res) => Responses.getUserFromToken(req, res));


// Event endpoint
// app.post('/event/new', (req, res))
app.get('/event/fromid', (req, res) => Responses.getEventFromId(req, res));


// Debug endpoints DO NOT ENABLE IN PRODUCTION check your config.yaml
if (config.server.debug) {
	console.warn('WARNING: You are using DEBUG ENDPOINTS. Do NOT have debug enabled in a production setting.');
	app.get('/debug/list/users', (req, res) => Responses.debugListUsers(req, res));
	app.get('/debug/list/students', (req, res) => Responses.debugListStudents(req,res));
	app.get('/debug/list/instructors', (req, res) => Responses.debugListInstructors(req,res));
}

// Catch all other requests and responds 404
app.all('/*', (req, res) => Responses.notFoundRequest(req, res));

// Start server
app.listen(config.server.port, () => {
	
	console.log(`Example app listening at http://localhost:${config.server.port}`);
});

export { version };
