import { Temporal } from '@js-temporal/polyfill';
import { version } from './server.js';

/**
 * Interface for the configuration.
 */
interface Config {
    server: {
        port: number,
		maintainance: {
			enabled: boolean,
			db_cron: string
			}
		debug: boolean
		security: {
			salt_key: string
			}
    };
	db: Required<{
		host: string,
		user: string,
		password: string,
		database: string,
	}>,
	google: Required<{
		clientID: string,
		clientSecret: string,
	}>,
	info: {
		apiBase: string,
		webappBase: string,
        studentCheck: string,
        instructorCheck: string,
	}
}

/**
 * Contains event objects
 */
class Event {
	// User info
	public teachid: string;
	public location: string;
	public maxStudents: number;
	public comments?: string;
	public name: string;

	// Backend info
	public id?: string;

	constructor(eventdata: {
		teachid: string,
		location: string,
		maxStudents: number,
		comments?: string,
		name: string,
		id?: string,
	}) {

		if (eventdata.id.length != 36) {
			throw new Error('Invalid event ID');
		}

		if (eventdata.teachid.length != 36) {
			throw new Error('Invalid instructor ID');
		}

		if (this.maxStudents < 0 || this.maxStudents > 0x7FFFFFFF) {
			throw new Error('Invalid maxStudents');
		}

		if (eventdata.name.length > 128) {
			throw new Error('Invalid name');
		}

		if (eventdata.location.length > 128) {
			throw new Error('Invalid location');
		}

		if (eventdata.comments && eventdata.comments.length > 500) {
			throw new Error('Invalid comments');
		}

		this.teachid = eventdata.teachid;
		this.location = eventdata.location;
		this.maxStudents = eventdata.maxStudents;
		this.comments = eventdata.comments;
		this.name = eventdata.name;
		this.id = eventdata.id;
	}


}

/**
 * A class representing both types of users.
 */
class User {
	public readonly TYPE: string = 'user_generic';
	public id: string;
	public firstname: string;
	public lastname: string;
	public googleid?: string;
	public email?: string;
    
	constructor(userdata: {
        id: string,
        firstname: string,
        lastname: string,
        googleid?: string,
        email?: string,
    }) {
		this.id = userdata.id;
		this.firstname = userdata.firstname;
		this.lastname = userdata.lastname;
		this.googleid = userdata.googleid;
		this.email = userdata.email;
	}
}

class Student extends User {
	public readonly TYPE: string = 'user_student';
	public homeroomteacher?: string;

	constructor(stu: {
		firstname: string,
		lastname: string,
		id: string,
		googleid?: string,
		email?: string,
		homeroomteacher?: string,

	}) {
		super({ firstname: stu.firstname, lastname: stu.lastname, googleid: stu.googleid, email: stu.email, id: stu.id });
		this.homeroomteacher = stu.homeroomteacher;
	}
}




class Instructor extends User {
	public readonly TYPE: string = 'user_instructor';
	public hashomeroom?: boolean;
	public homeroomlocation?: string;


	constructor(ins: {
		firstname: string,
		lastname: string,
		googleid?: string,
		id: string,
		hashomeroom?: boolean,
		homeroomlocation?: string,
	}) {
		super({ firstname: ins.firstname, lastname: ins.lastname, googleid: ins.googleid, id: ins.id });
		this.hashomeroom = ins.hashomeroom;
		this.homeroomlocation = ins.homeroomlocation;
	}
}

class RegistrationData {
	public email: string;
	public googleid: string;
	public firstname: string;
	public lastname: string;

	constructor(reg: {
		email: string,
		googleid: string,
		firstname: string,
		lastname: string}
	) {
		this.email = reg.email;
		this.googleid = reg.googleid;
		this.firstname = reg.firstname;
		this.lastname = reg.lastname;
	}

}

class Payload {
	public time: string = Temporal.Now.instant().toString();
	public version: string = version;
	public status?: string;
	public data?: User | User[] | Event | Event[];
	private token?: string;

	constructor(payload:{
		status: string,
		data?: User | User[] | Event | Event[],
		token?: string
	}) {
		this.status = payload.status;
		this.data = payload.data;
		this.token = payload.token;
	}

	public getToken(): string | undefined {
		return this.token;
	}

	public static replacer(key: string, value: unknown): unknown|undefined {
		if (key === 'token') {
			return undefined;
		}
		return value;
	}
}


export { Payload, Config, User, Student, Instructor, RegistrationData, Event };