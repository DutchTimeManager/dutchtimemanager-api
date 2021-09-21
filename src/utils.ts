import mysql from 'mysql2';
import express from 'express';

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

    public static invalidRequest(req: Request<{}, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>, number>) {
        
    }

}

export { Responses };