
import express from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { Instructor, Payload, RegistrationData, Student } from './types';
import utils from './utils';
import { config } from './server';
import Utils from './utils';

class Responses {
	private static OAuth2Client: OAuth2Client;

	/**, 
	 * Initialize the Oauth2 client to google.
	 */
	public static setup(): void {
		Responses.OAuth2Client = new google.auth.OAuth2(
			config.google.clientID,
			config.google.clientSecret,
			config.info.apiBase + '/oauthlogin/catch'
		);
	}

	/**
	 * Respond's 400 Bad Request with the path that was requested.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static invalidRequest(req: express.Request, res: express.Response): void {
		res.header('Content-Type', 'text/plain');
		res.status(400).send(`HTTP/${req.httpVersion} ${req.method} ${req.path} Invalid Request`);
	}

	/**
	 * Respond's 404 Not found with the path that was requested.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static notFoundRequest(req: express.Request, res: express.Response): void {
		res.header('Content-Type', 'text/plain');
		res.status(404).send(`HTTP/${req.httpVersion} ${req.method} ${req.path} Not Found`);
	}

	/**
	 * Respond's 200 OK about the status of the server.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static statusCheck(req: express.Request, res: express.Response): void {
		res.header('Content-Type', 'application/json');
		const statusPackage: Payload = new Payload({
			status: 'OK'
		});
		res.status(200).send(JSON.stringify(statusPackage));
	}

	/**
	 * Respond's 500 Internal Server Error.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static internalError(req: express.Request, res: express.Response, err: Error): void {
		res.header('Content-Type', 'text/plain');
		res.status(500).send(`HTTP/${req.httpVersion} ${req.method} ${req.path} Internal Server Error \n\n${err.toString()}`);
	}

	/**
	 * Start OAuth2 authentication.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static startOAuth2(req: express.Request, res: express.Response): void {
		const authUrl = Responses.OAuth2Client.generateAuthUrl({
			access_type: 'online',
			scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email', 'openid']
		});

		res.redirect(authUrl);
	}

	/**
	 * Sends back payload to the client.
	 * @param payload Payload to be sent to the client.
	 * @param req Request object from Express.
	 * @param res Response object from Express.
	 */
	private static sendPayload(payload: Payload, req: express.Request, res: express.Response): void {
		res.header('Content-Type', 'application/json');
		if (payload.getToken()) {
			res.cookie('token', payload.getToken(), { maxAge: 3600000, domain: config.info.apiBase });
		}

		res.status(200).send(JSON.stringify(payload, Payload.replacer));
	}
	
	/**
     * 
     * @param token {string} Token to be verified.
     * @param res 
     */
	private static tokenRedir(token: string, res: express.Response): void {
		res.redirect(`${config.info.webappBase}/?t=${token}`);
	}

	/**
	 * Catch OAuth2 redirect.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static catchOAuth2(req: express.Request, res: express.Response): void {
		let code = '';
		if (req.query.code !== undefined) { code = req.query.code.toString(); }

		if (code !== '') {
			Responses.OAuth2Client.getToken(code.toString(), (err, tokens) => {
				if (err) {
					console.error(err);

					return Responses.invalidRequest;
				}
				if (tokens?.access_token) {
					Responses.OAuth2Client.setCredentials(tokens);

					google.people({ version: 'v1', auth: Responses.OAuth2Client }).people.get({ personFields: 'names,emailAddresses', resourceName: 'people/me' }, async (err, response) => {
						if (err) {
							console.error(err);

							return Responses.invalidRequest(req, res);
						}

						if (response?.status !== 200) {
							res.header('content-type: plain/text');
							res.status(response?.status ?? 400).send(response?.statusText);
							return;
						}

						if (response?.data) {
							console.log(response.data);
							let gid = '';
							if (response.data.resourceName) {
								gid = response.data.resourceName?.substring(7);
								console.log(gid);
								
							} else { return Responses.internalError(req, res, new Error('No Google ID')); }
							const user = await utils.userExists(gid);

							console.log(user);


							if (user instanceof Student || user instanceof Instructor) {

								console.log('Logging in');
								const loggedin = Utils.loginUser(user);

								if (loggedin instanceof Error) {
									console.error(loggedin);
									return Responses.internalError(req, res, loggedin);
								}

								const token = loggedin.getToken();
								
								if (token) {
									Responses.tokenRedir(token, res);
									
								}

							}

							if (user === undefined) {
								// TODO: Register func
								console.log('Made it to register');

								if (response.data.emailAddresses !== undefined && response.data?.names !== undefined) {
									console.log('Made it to data check');


									const firstname: string = response.data.names[0].givenName ??= 'fail', lastname: string = response.data.names[0].familyName ??= 'fail';

									const regData: RegistrationData = {
										email: response.data.emailAddresses[0].value ??= 'fail',
										googleid: gid,
										firstname: firstname,
										lastname: lastname
									};

									const regpayload = await utils.registerUser(regData);

									if (regpayload instanceof Error) {
										console.error(regpayload);
										return Responses.internalError(req, res, regpayload);
									}

									const token = regpayload.getToken();
									if ( token !== undefined) {
										Responses.tokenRedir(token, res);
									}
								}
							}
						} else {
							return Responses.invalidRequest(req, res);
						}
					});
				}
			});
		} else {
			Responses.invalidRequest(req, res);
		}
	}

	/**
     * Get user from id.
     * @param {express.Request} req
     * @param {express.Response} res
     */
	public static async getUserFromId(req: express.Request, res: express.Response): Promise<void> {
		const id: string = req.query.id.toString();
		console.log(id);
        
		const user = await Utils.getUserFromID(id);
		if (user instanceof Error) {
			console.error(user);
			return Responses.internalError(req, res, user);
		}
		const payload: Payload = new Payload({
			status: 'OK',
			data: user,
		});

		return this.sendPayload(payload, req, res );
	}
}




export default Responses;