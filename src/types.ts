import { Temporal } from '@js-temporal/polyfill';
import { version } from './server';

class Payload {
	public time: string = Temporal.Now.instant().toString();
	public version: string = version;

	public status?: string;
	public data?: Student | Instructor;

	private token?: string;

	constructor(payload:{
		status: string,
		data?: Student | Instructor,
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


interface Config {
    server: {
        port: number,
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
		redirURL: string,
	}>,
	info: {
		apiBase: string,
		webappBase: string,
        studentCheck: string,
        instructorCheck: string,
	}
}

// SRA gang

class Student {
	public readonly TYPE = 'user_student';
	public firstname: string;
	public lastname: string;
	public googleid?: string;
	public studentid: string;
	public email?: string;
	public homeroomteacher?: string;

	constructor(stu: {
		firstname: string,
		lastname: string,
		studentid: string,
		googleid?: string,
		email?: string,
		homeroomteacher?: string,

	}) {
		this.firstname = stu.firstname;
		this.lastname = stu.lastname;
		this.googleid = stu.googleid;
		this.studentid = stu.studentid;
		this.email = stu.email;
		this.homeroomteacher = stu.homeroomteacher;
	}
}




class Instructor {
	public readonly TYPE = 'user_instructor';
	public firstname: string;
	public lastname: string;
	public googleid?: string;
	public instructorid: string;
	public hashomeroom?: boolean;
	public homeroomlocation?: string;


	constructor(ins: {
		firstname: string,
		lastname: string,
		googleid?: string,
		instructorid: string,
		hashomeroom?: boolean,
		homeroomlocation?: string,
	}) {
		this.firstname = ins.firstname;
		this.lastname = ins.lastname;
		this.googleid = ins.googleid;
		this.instructorid = ins.instructorid;
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


export { Payload, Config, Student, Instructor, RegistrationData };