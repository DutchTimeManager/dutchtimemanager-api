import Db from 'mysql2-async';
import { Config } from '../types.js';
import YAML from 'js-yaml';
import fs from 'fs';

class Utils {
	/**
	 * Database connection to be used by the api.
	 * 
	 * @remarks
	 * Settings are defined in the config file.
	 */
	public static pool: Db;

	/**
	 * Config used by everything
	 */
	public static config: Config;

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
		return this.config;
	}
}

export default Utils;