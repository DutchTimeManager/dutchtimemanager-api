import { Instructor, Payload, Student, User } from '../types.js';
import Utils from './utils.js';

class UserUtils extends Utils {

	/**
	 * Checks if the user is a student and returns a student object if there is one.
	 *
	 * @param {string} googleid The googleid of the user.
	 */ 
	public static async checkIfStudent(googleid: string): Promise<Student | Error | undefined> {
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
		const instCheck: Instructor | Error | undefined = await this.checkIfInstructor(googleid);
		if (instCheck instanceof Error) {
			return instCheck;
		}
		if (instCheck) {
			return instCheck;
		}
	
		const stucheck: Student | Error | undefined = await this.checkIfStudent(googleid);
		if (stucheck) {	
			return stucheck;
		}
	
		return undefined;
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

	



}

export default UserUtils;