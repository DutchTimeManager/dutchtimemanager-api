import Db from 'mysql2-async';
import { Config } from '../types.js';
import YAML from 'js-yaml';
import fs from 'fs';
import crypto from 'crypto';
import { Temporal } from '@js-temporal/polyfill';
class Utils {
	/**
	 * Database connection to be used by the api.
	 * 
	 * @remarks
	 * Settings are defined in the config file.
	 */
	public static pool: Db;
	
	/**
	 * Temporary storage for the states currently being authenticated.
	 * TODO: DB or something to share this across endpoints.
	 * @type {string: string}
	 */
	private static states: {[key: string]: string} = {};

	/**
	 * Config used by everything
	 */
	public static config: Config;

	/**
	 * 
	 */
	private static hasher: crypto.Hmac;

	/**
	 * @param pool The database connection to be used.
	 * 
	 * @remarks
	 * Created inside of the server.ts file and passed to here.
	 */
	public static setup(pool: Db): void {
		this.pool = pool;
	}

	// General utilities
	/**
	 * Performs maintenance and cleanup on the database.
	 */ 
	public static async databaseMaintenance(): Promise<void> {
		return await this.pool.transaction(async (transaction) => {
			await transaction.delete('delete from tokendb where TIMESTAMPDIFF(MINUTE, lastused, NOW()) > 60');
		});
	}

	/**
	 * Loads the configuration file.
	 * @param {string} path Path of the config file to load.
	 */
	public static async loadConfig(path: string): Promise<Config> {
		this.config = YAML.load(fs.readFileSync(path, 'utf8'), {schema: YAML.CORE_SCHEMA}) as Config;
		// console.log(this.config);
		this.hasher = crypto.createHmac('sha256', this.config.server.security.salt_key);
		return this.config;
	}

	// Security utilities
	/**
	 * Generates a cryptographically secure state object for the OAuth2 process.
	 * @param {string} origin The origin of the request.
	 * @returns {{string: string}} The state object.
	 */
	public static generateState(origin: string): string {
		const state = this.hasher.update(origin + Temporal.Now.instant).digest('base64');
		this.states[state] = origin;
		return state;
	}

	/**
	 * Checks if the state is valid. If it is it returns the origin.
	 * @param {string} state The state to return origin for.
	 * @returns {string} The origin of the request.
	 */
	public static getState(state: string): string | undefined {
		origin = this.states[state];
		delete this.states[state];
		return origin;
	}
}

export default Utils;