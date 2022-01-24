import { Temporal } from '@js-temporal/polyfill';
import crypto from 'crypto';
import { RegistrationData, Payload, Instructor, Student, User } from '../types.js';
import UserUtils from './users.js';
import Utils from './utils.js';

class AuthUtils extends Utils {
	/**
	 * Trys to register a user to the database.
	 * @param {RegistrationData} regdata The data needed to register an account.
	 * @returns {Promise<Payload | Error>} Returns a student, instructor, or error 
	 */
	public static async registerUser(regdata: RegistrationData): Promise<Payload | Error> {

		if (regdata.email.match(RegExp(this.config.info.studentCheck))) {
			return this.registerStudent(regdata);
		}

		if (regdata.email.match(RegExp(this.config.info.instructorCheck))) {
			return this.registerInstructor(regdata);
		}

		return Error('User is not eligible to register');
	}

	/**
	 * Registers a student to the database.
	 * @param {RegistrationData} regdata The registration data of the user.
	 * @returns {Promise<Payload>} Returns a student object.
	 */
	private static async registerStudent(regdata: RegistrationData): Promise<Payload | Error> {
		await this.pool.insert('insert into studentdb (firstname, lastname, email, googleid) values (?, ?, ?, ?);', [regdata.firstname, regdata.lastname, regdata.email, regdata.googleid]);

		const studentid: string | undefined = await this.pool.getval<string>('select `id` from studentdb where googleid = ?;', [regdata.googleid]);

		if (!studentid) {
			return Error('Student was not registered');
		}
		

		const token = this.generateToken(studentid);
		this.pool.insert('insert into tokendb(token, `id`) values (?,?);', [token, studentid]);

		return new Payload({
			status: 'success',
			data: new Student({
				id: studentid,
				firstname: regdata.firstname,
				lastname: regdata.lastname,
			}),
			token: token
		});

	}

	private static async registerInstructor(regdata: RegistrationData): Promise<Payload | Error> {
		await this.pool.insert('insert into instructordb (firstname, lastname, email, googleid) values (?, ?, ?, ?);', [regdata.firstname, regdata.lastname, regdata.email, regdata.googleid]);

		const instructorid: string | undefined = await this.pool.getval<string>('select `id` from instructordb where googleid = ?;', [regdata.googleid]);

		if (!instructorid) {
			return Error('Instructor was not registered');
		}

		const token = this.generateToken(instructorid);
		this.pool.insert('insert into tokendb(token, `id`) values (?,?);', [token, instructorid]);
		return new Payload({
			status: 'success',
			data: new Instructor({
				id: instructorid,
				firstname: regdata.firstname,
				lastname: regdata.lastname,
			}),
			token: token
		});
	}

	/**
	 * Generates a token for a user.
	 * @param {string} userid The googleid of the user.
	 * @returns {string} Returns a token to be set as a cookie 
	 */
	public static generateToken(userid: string): string {
		const nonce: number = crypto.randomBytes(6).readUIntBE(0, 6);
		const basedata: string = userid + nonce + Temporal.Now.instant.toString();
		const token: string = crypto.createHash('SHA3-512').update(basedata).digest('base64');
		return token;
	}

	/**
	 * Logs an existing user in.
	 * @param {User} user The user to log in.
	 * @returns {Payload | Error} Returns a payload with the user and token or Error.
	 */
	public static loginUser(user: User): Payload | Error {
		const token = this.generateToken(user.id);
		this.pool.insert('insert into tokendb(token, `id`) values (?,?);', [token, user.id]);
		return new Payload({
			status: 'success',
			data: user,
			token: token
		});
	}

	/**
	 * Authenticates a token and returns the user. Or returns undefined if the token is invalid.
	 * @param {string} token The token to authenticate.
	 * @returns {Instructor | Student | undefined} Returns the user if the token is valid.
	 */
	public static async authenticateToken(token: string): Promise<Instructor | Student | undefined | Error> {
		const userid: string | undefined = await this.pool.getval<string>('select `id` from tokendb where token = ?;', [token]);

		if (!userid) {
			return undefined;
		}
		const user: Instructor| Student | Error = await UserUtils.getUserFromID(userid);
		
		if (!user) {
			return undefined;
		}

		return user;
	}
}

export default AuthUtils;