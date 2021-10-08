import mysql from 'mysql2';
import express from 'express';
import { Temporal } from '@js-temporal/polyfill';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { Instructor, Payload, Student } from './types';
class Responses {
	private static pool: mysql.Pool;

	private static OAuth2Client: OAuth2Client;

	/**
	 * Initialize the database connection pool.
	 * @param {mysql.pool} pool - The database connection pool.
	 */
	public static setup(pool: mysql.Pool, googlecredentials: {
		id: string,secret: string, redirURL: string}): void {
		Responses.pool = pool;
		Responses.OAuth2Client = new google.auth.OAuth2(
			googlecredentials.id,
			googlecredentials.secret,
			googlecredentials.redirURL,
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
		const statusPackage: Payload = {
			status: 'OK',
			version: '0.0.0',
			time: Temporal.Now.instant().toString(),
		};
		res.status(200).send(JSON.stringify(statusPackage));
	}

	/**
	 * Respond's 500 Internal Server Error.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static internalError(req: express.Request, res: express.Response, err: Error):void {
		res.header('Content-Type', 'text/plain');
		res.status(500).send(`HTTP/${req.httpVersion} ${req.method} ${req.path} Internal Server Error \n\n${err.toString()}`);
	}

	/**
	 * Start OAuth2 authentication.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static startOAuth2(req: express.Request, res: express.Response):void {
		const authUrl = Responses.OAuth2Client.generateAuthUrl({
			access_type: 'online',
			scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email', 'openid']
		});

		res.redirect(authUrl);
	}

	/**
	 * Catch OAuth2 redirect.
	 * @param {express.Request} req
	 * @param {express.Response} res
	 */
	public static catchOAuth2(req: express.Request, res: express.Response):void {
		let code = '';
		if (req.query.code !== undefined) { code = req.query.code.toString(); }

		console.log(code);
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
								gid = response.data.resourceName?.substr(7);
							} else { return Responses.internalError(req, res, new Error('No Google ID')); }
							Responses.userExists(gid);
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
	 * Checks if the user is a student and returns a student object if there is one.
	 *
	 * @param {string} googleid The googleid of the user.
	 */
	private static checkIfStudent(googleid: string): Student | Error | undefined {
		let student: Student | undefined;
		Responses.pool.query('select firstname, lastname, googleid, studentid from studentdb where `googleid` = ?;', [googleid], (err, results) => {
			if (err) {
				console.error(err);
				return err;
			}

			// Data formatting so that its easier to use.
			const sturesults: [{
				firstname: string,
				lastname: string,
				googleid: string,
				studentid: string
			}] = JSON.parse(JSON.stringify(results));

			if (sturesults.length > 0) {
				student = new Student({
					firstname: sturesults[0].firstname,
					lastname: sturesults[0].lastname,
					googleid: sturesults[0].googleid,
					studentid: sturesults[0].studentid,
				});
			}
		});
		return student;
	}

	/**
	 * Checks if the user is an instructor and returns a instructor object if there is one.
	 *
	 * @param {string} googleid The googleid of the user.
	 */
	private static checkIfInstructor(googleid: string): Instructor | Error | undefined {
		let instructor: Instructor | undefined = undefined;
		Responses.pool.query('select firstname, lastname, googleid, instructorid from instructordb where `googleid` = ?;', [googleid], (err, results) => {
			if (err) {
				console.error(err);
				return err;
			}

			// Data formatting so that its easier to use.
			const instresults: [{ firstname: string, lastname: string, googleid: string, instructorid: string }] = JSON.parse(JSON.stringify(results));

			if (instresults.length > 0) {
				instructor = new Instructor({
					firstname: instresults[0].firstname,
					lastname: instresults[0].lastname,
					googleid: instresults[0].googleid,
					studentid: instresults[0].instructorid
				});
			}
		});
		return instructor;
	}

	/**
	 * Checks if a user exists in the database based on googleID, returns type of user if there is one.
	 * 
	 * @param {string} googleid The googleid of the user.
	 * @returns {Student | Instructor | Error | undefined} Returns a student, instructor, or error if there is one else, returns undefined.
	 */
	private static userExists(googleid: string): Instructor | Student | Error | undefined {
		const instCheck: Instructor | Error | undefined = Responses.checkIfInstructor(googleid);
		if (instCheck instanceof Error) {
			return instCheck;
		}
		if (instCheck !== undefined) {
			return instCheck;
		}

		const stucheck: Student | Error | undefined = Responses.checkIfStudent(googleid);
		if (stucheck !== undefined) {
			return stucheck;
		}

		return undefined;
	}
}



export { Responses };