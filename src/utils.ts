import mysql from 'mysql2';
import express from 'express';
import { Temporal } from '@js-temporal/polyfill';
import { Payload } from './types';
class Responses {
    private static pool: mysql.Pool;

    /**
     * Initialize the database connection pool.
     * @param {mysql.pool} pool - The database connection pool.
     *
     */
    public Responses(pool: mysql.Pool) {
        Responses.pool = pool;
    }

    /**
     * Respond's 400 Bad Request with the path that was requested.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    public static invalidRequest(req: express.Request, res: express.Response) {
        res.header('Content-Type', 'text/plain');
        res.status(400).send('HTTP/' + req.httpVersion + ' ' + req.method + ' ' + req.path + ' ' + 'Invalid Request');

    }

    /**
     * Respond's 404 Not found with the path that was requested.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    public static notFoundRequest(req: express.Request, res: express.Response) {
        res.header('Content-Type', 'text/plain');
        res.status(404).send('HTTP/' + req.httpVersion + ' ' + req.method + ' ' + req.path + ' ' + 'Not Found');

    }

    /**
     * Respond's 200 OK about the status of the server.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    public static statusCheck(req: express.Request, res: express.Response) {
        res.header('Content-Type', 'application/json');
        const statusPackage: Payload = {
            'status': 'OK',
            'version': '0.0.0',
            'time': Temporal.Now.instant().toString()
        }
        res.status(200).send(JSON.stringify(statusPackage));
    }

    
}

export { Responses };