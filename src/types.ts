import temporal from '@js-temporal/polyfill';

interface Payload {
    'status'?: string,
    'time'?: string,
    'version': Required<string>,
}

interface Config {
    db: {
        host: string,
        user: string,
        password: string,
        database: string,
    },
    google: {
        clientID: string,
        clientSecret: string,
        redirURL: string,
        apiKey: string,
    },
}

class Student {
    public firstname: string;
    public lastname: string;
    public googleid: string;
    public studentid: string;
    public hashomeroom?: boolean;
    public homeroomlocation?: string;


    constructor(stu: Student) {
        this.firstname = stu.firstname;
        this.lastname = stu.lastname;
        this.googleid = stu.googleid;
        this.studentid = stu.studentid;
        this.homeroomteacher = stu.homeroomteacher;
    }
}


interface Student {
    firstname: string,
    lastname: string,
    googleid: string,
    studentid: string,
    homeroomteacher?: string,
}


class Instructor {
    public firstname: string;
    public lastname: string;
    public googleid: string;
    public studentid: string;
    public hashomeroom?: boolean;
    public homeroomlocation?: string;


    constructor(ins: Instructor) {
        this.firstname = ins.firstname;
        this.lastname = ins.lastname;
        this.googleid = ins.googleid;
        this.studentid = ins.studentid;
        this.hashomeroom = ins.hashomeroom;
        this.homeroomlocation = ins.homeroomlocation;
    }
}

interface Instructor {
    firstname: string,
    lastname: string,
    googleid: string,
    studentid: string,
    hashomeroom?: boolean,
    homeroomlocation?: string,
}

export { Payload, Config, Student, Instructor };