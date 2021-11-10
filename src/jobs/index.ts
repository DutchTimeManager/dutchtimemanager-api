import { config } from '../server';

module.exports = [
	{
		name: 'db-cleanup',
		cron: config.server.maintainance.db_cron ?? '0 0 * * *',
	}
];