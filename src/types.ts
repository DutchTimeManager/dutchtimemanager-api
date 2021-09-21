import temporal from '@js-temporal/polyfill';

interface Payload {
    'status'?: string,
    'time'?: string,
    'version': Required<string>,
}


export {Payload};