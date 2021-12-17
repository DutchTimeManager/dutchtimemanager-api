import { Payload, Student, Instructor } from '../types';
import Utils from './utils';

class DebugUtils extends Utils {
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
	 * Lists all the students in the database.
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