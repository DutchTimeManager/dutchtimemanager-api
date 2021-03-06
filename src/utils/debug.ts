import { Payload, Student, Instructor, User } from '../types.js';
import Utils from './utils.js';

class DebugUtils extends Utils {
	/**
	 * Lists all the users in the database.
	 * @returns {Promise<Payload>}
	 */
	public static async debugListUsers(): Promise<Payload> {
		
		const queries = [
			'SELECT `id`, firstname, lastname from instructordb;',
			'SELECT `id`, firstname, lastname from studentdb;'
		];
		const users: User[] = [];
		const streams = queries.map(query => Utils.pool.stream<User>(query));
		
		for (const stream of streams) {
			for await (const user of stream) {
				users.push(new User(user));
			}
		}

		return new Payload({status:'200', data: users});
	}

	/**
	 * Lists all the students in the database.
	 * @returns {Promise<Payload>}
	 */
	public static async debugListStudents(): Promise<Payload> {
		const students: Student[] = [];
		const stream = Utils.pool.stream<Student>('SELECT `id`, firstname, lastname from studentdb;');
		for await (const user of stream) {
			students.push(new Student(user));
		}
		return new Payload({status:'200', data: students});
	}

	/**
	 * Lists all the Instructors in the database.
	 * @returns {Promise<Payload>}
	 */
	public static async debugListInstructors(): Promise<Payload> {
		const instructors: Instructor[] = [];
		const stream = Utils.pool.stream<Instructor>('SELECT `id`, firstname, lastname from studentdb;');
		for await (const user of stream) {
			instructors.push(new Instructor(user));
		}
		return new Payload({status:'200', data: instructors});
	}
}

export default DebugUtils;