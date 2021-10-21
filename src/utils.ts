import Db from 'mysql2-async';
import { Student, Instructor, Payload, RegistrationData } from './types';
import { studentCheck, instructorCheck } from './config';
import crypto from 'crypto';
import { Temporal } from '@js-temporal/polyfill';


class Utils {
	private static pool: Db;

	public static setup(pool: Db): void {
		this.pool = pool;
	}


	/**
	 * Checks if the user is a student and returns a student object if there is one.
	 *
	 * @param {string} googleid The googleid of the user.
	 */
	private static async checkIfStudent(googleid: string): Promise<Student | Error | undefined> {
		let student: Student = await Utils.pool.getrow<Student>('select firstname, lastname, googleid, studentid from studentdb where `googleid` = ?;', [googleid]).catch(e => {
			console.error(e);
			return e;
		});
		if (student) {student = new Student(student);		}
		console.log(student);
		return student;

	}

	/**
     * Checks if the user is an instructor and returns a instructor object if there is one.
     *
     * @param {string} googleid The googleid of the user.
     */
	private static async checkIfInstructor(googleid: string): Promise<Instructor | Error | undefined> {
		let instructor: Instructor = await Utils.pool.getrow<Instructor>('select firstname, lastname, googleid, instructorid from instructordb where `googleid` = ?;', [googleid]).catch(e => {
			console.error(e);
			return e;
		});
		if (instructor) {instructor = new Instructor(instructor);		}
		
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

		if (studentCheck(regdata.email)) {
			return Utils.registerStudent(regdata);
		}

		// if (instructorCheck(regdata.email)) {
		// 	return Utils.registerInstructor(regdata);
		// }

		return Error('User is not eligible to register');
	}

	/**
     * Registers a student to the database.
     * @param {RegistrationData} regdata The registration data of the user.
     * @returns {Promise<Payload>} Returns a student object.
     */
	private static async registerStudent(regdata: RegistrationData): Promise<Payload | Error> {
		await this.pool.query('insert into studentdb (firstname, lastname, email, googleid) values (?, ?, ?, ?);', [regdata.firstname, regdata.lastname, regdata.email, regdata.googleid]);
		
		const studentid: string | undefined = await this.pool.getval<string>('select studentid from studentdb where googleid = ?;', [regdata.googleid]);

		if (!studentid) {
			return Error('Student was not registered');
		}

		const token = Utils.generateToken(studentid);


		// this.pool.insert('', [Buffer.from(token, 'base64').toString('binary'), studentid]);

		return new Payload({
			status: 'success',
			data: new Student ({
				studentid: studentid,
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
	 * @param {Student | Instructor} user The user to log in.
	 */

	public static loginUser(user: Student | Instructor): Payload | Error {
		let id: string;

		if (user instanceof Student) {
			id = user.studentid;
		} else if (user instanceof Instructor) {
			id = user.instructorid;
		} else {
			return Error('User is not a student or instructor');
		}


		const token = Utils.generateToken(id);
		return new Payload({
			status: 'success',
			data: user,
			token: token
		});
	}



}

export default Utils;