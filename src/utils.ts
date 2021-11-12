import Db from 'mysql2-async';
import { Student, Instructor, Payload, RegistrationData, User, Config } from './types.js';
import crypto from 'crypto';
import { Temporal } from '@js-temporal/polyfill';
import YAML from 'js-yaml';
import fs from 'fs';

class Utils {
	/**
	 * Database connection to be used by the api.
	 * 
	 * @remarks
	 * Settings are defined in the config file.
	 */
	private static pool: Db;

	/**
	 * Config used by everything
	 */
	public static config: Config;

	/**
	 * 
	 * @param pool The database connection to be used.
	 * 
	 * @remarks
	 * Created inside of the server.ts file and passed to here.
	 */
	public static setup(pool: Db): void {
		this.pool = pool;
	}


	/**
	 * Checks if the user is a student and returns a student object if there is one.
	 *
	 * @param {string} googleid The googleid of the user.
	 */ 
	private static async checkIfStudent(googleid: string): Promise<Student | Error | undefined> {
		let student: Student = await Utils.pool.getrow<Student>('select firstname, lastname, googleid, `id` from studentdb where `googleid` = ?;', [googleid]).catch(e => {
			console.error(e);
			return e;
		});
		if (student) { student = new Student(student); }
		console.log(student);
		return student;

	}

	/**
	 * Checks if the user is an instructor and returns a instructor object if there is one.
	 *
	 * @param {string} googleid The googleid of the user.
	 */
	private static async checkIfInstructor(googleid: string): Promise<Instructor | Error | undefined> {
		let instructor: Instructor = await Utils.pool.getrow<Instructor>('select firstname, lastname, googleid, `id` from instructordb where `googleid` = ?;', [googleid]).catch(e => {
			console.error(e);
			return e;
		});
		if (instructor) { instructor = new Instructor(instructor); }

		return instructor;

	}

	/**
	 * Checks if a user exists in the database based on googleID, returns type of user if there is one.
	 * 
	 * @param {string} googleid The googleid of the user.
	 * @returns {Student | Instructor | Error | undefined} Returns a student, instructor, or error if there is one else, returns undefined.
	 */
	public static async userExists(googleid: string): Promise<Instructor | Student | Error | undefined> {
		const instCheck: Instructor | Error | undefined = await Utils.checkIfInstructor(googleid);
		if (instCheck instanceof Error) {
			return instCheck;
		}
		if (instCheck) {
			return instCheck;
		}

		const stucheck: Student | Error | undefined = await Utils.checkIfStudent(googleid);
		if (stucheck) {
			console.log(stucheck);

			return stucheck;
		}

		return undefined;
	}

	/**
	 * Trys to register a user to the database.
	 * @param {RegistrationData} regdata The data needed to register an account.
	 * @returns {Promise<Payload | Error>} Returns a student, instructor, or error 
	 */
	public static async registerUser(regdata: RegistrationData): Promise<Payload | Error> {

		if (regdata.email.match(RegExp(this.config.info.studentCheck))) {
			return Utils.registerStudent(regdata);
		}

		if (regdata.email.match(RegExp(this.config.info.instructorCheck))) {
			return Utils.registerInstructor(regdata);
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

		const token = Utils.generateToken(studentid);


		// this.pool.insert('', [Buffer.from(token, 'base64').toString('binary'), studentid]);

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

		const token = Utils.generateToken(instructorid);

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
		const token = Utils.generateToken(user.id);
		this.pool.insert('insert into tokendb(token, `id`) values (?,?);', [token, user.id]);
		return new Payload({
			status: 'success',
			data: user,
			token: token
		});
	}

	/**
	 * Returns a user based on an id.
	 * @param {string} id The id of the user.
	 * @returns {Student | Instructor | Error} Returns a student, instructor, or error if there is one else, returns undefined.
	 */
	public static async getUserFromID(id: string): Promise<Student | Instructor | Error | undefined> {
		const queries = [
			'SELECT `id`, firstname, lastname, email, hashomeroom, homeroomlocation FROM instructordb WHERE `id` = ?;',
			'SELECT `id`, firstname, lastname, email, homeroomteacher FROM studentdb WHERE `id` = ?;'
		];

		const promises = queries.map(query => Utils.pool.getrow<Student | Instructor>(query, [id]));

		for (const promise of promises) {
			const result = await promise;
			if (result !== undefined && result.id) {
				if (result.email.match(RegExp(this.config.info.studentCheck)) !== null) {					
					return new Student(result);
				} else {
					return new Instructor(result);
				}
			}
		}

		return;
	} 

	/**
	 * Performs routine maintenance and cleanup on the database.
	 */ 
	public static async databaseMaintenance(): Promise<void> {
		return await this.pool.transaction(async (transaction) => {
			await transaction.delete('delete from tokendb where TIMESTAMPDIFF(MINUTE, lastused, NOW()) > 60');
		});
	}

	/**
	 * Loads the configuration file.
	 */
	public static async loadConfig(path: string): Promise<Config> {
		this.config = YAML.load(fs.readFileSync(path, 'utf8'), {schema: YAML.CORE_SCHEMA}) as Config;
		// console.log(this.config);
		return this.config;
	}
}

export default Utils;