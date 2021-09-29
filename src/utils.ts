import mysql from 'mysql2';
import express from 'express';
import { Temporal } from '@js-temporal/polyfill';
import { Payload } from './types';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
class Responses {
    private static pool: mysql.Pool;
    private static OAuth2Client: OAuth2Client;

    /**
     * Initialize the database connection pool.
     * @param {mysql.pool} pool - The database connection pool.
     */
    public static setup(pool: mysql.Pool, googlecredentials: { id: string, secret: string, redirURL: string }) {
        Responses.pool = pool;
        Responses.OAuth2Client = new google.auth.OAuth2(googlecredentials.id, googlecredentials.secret, googlecredentials.redirURL);
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

    /**
     * Respond's 500 Internal Server Error.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    public static internalError(req: express.Request, res: express.Response, err: Error) {
        res.header('Content-Type', 'text/plain');
        res.status(500).send('HTTP/' + req.httpVersion + ' ' + req.method + ' ' + req.path + ' ' + 'Internal Server Error \n\n' + err.toString());
    }





    /**
     * Start OAuth2 authentication.
     * @param {express.Request} req
     * @param {express.Response} res
     */
    public static startOAuth2(req: express.Request, res: express.Response) {
        const authUrl = Responses.OAuth2Client.generateAuthUrl({
            access_type: 'online',
            scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email', 'openid']
        });

        res.redirect(authUrl);
    }

    /**
     * Catch OAuth2 redirect.
     * @param {express.Request} req
     * @param {express.Response} res
     */
    public static catchOAuth2(req: express.Request, res: express.Response) {
        let code: string = '';
        if (req.query.code !== undefined)
            code = req.query.code.toString();

        console.log(code);
        if (code !== '') {

            Responses.OAuth2Client.getToken(code.toString(), (err, tokens) => {
                if (err) {
                    console.error(err);

                    return Responses.invalidRequest
                }
                if (tokens?.access_token) {
                    Responses.OAuth2Client.setCredentials(tokens);

                    google.people({ version: 'v1', auth: Responses.OAuth2Client }).people.get({ personFields: 'names,emailAddresses', resourceName: 'people/me' }, async (err, response) => {

                        if (err) {
                            console.error(err);

                            return Responses.invalidRequest(req, res);
                        }

                        if (response?.status !== 200) {
                            res.header('content-type: plain/text')
                            res.status(response?.status ?? 400).send(response?.statusText);
                            return
                        }

                        if (response?.data) {
                            console.log(response.data);

                            
                            

                            this.pool.query('select firstname, lastname, googleid, studentid from studentdb where `googleid` = ?;', [response.data.resourceName?.substr(7)], (err, results) => {
                                if (err) {
                                    console.error(err);
                                    Responses.internalError(req, res, err);
                                }

                                // results[0]

                                console.log(results);

                            });

                        } else {
                            return Responses.invalidRequest(req, res);
                        }
                    });
                }


            });
        } else {
            Responses.invalidRequest(req, res);
        }
    }
}

class Utils {
    checkIfStudent(googleid: string) {
    }
}

export { Responses };