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

interface Student {
    firstname: string,
    lastname: string,
    googleid: string,
    studentid: string,
    email: string,
    homeroomteacher?: string,
}
export { Payload, Config };