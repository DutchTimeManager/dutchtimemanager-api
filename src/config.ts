import { Config } from './types';

const config: Required<Config> = {
	db: {
		host: 'db.example.net',
		user: 'dtm',
		password: 'thisisapassword',
		database: 'dutchtimemanager',
	},
	google: {
		clientID: 'abcdef6hijklmnop.apps.googleusercontent.com',
		clientSecret: 'This is a secret',
		redirURL: 'https://api.example.net/oauthlogin/catch',
	},
	info: {
		apiBase: 'https://api.example.net',
		webappBase: 'https://app.example.net'
	}
};

function studentCheck(email: string): boolean {
	return email.match(/^(\d\d-).*@example.edu/) !== null;
}

function instructorCheck(email: string): boolean {
	return email.match(/^(\w+)@example.edu/) !== null;
}

export {config, studentCheck, instructorCheck};
