import 'os';
import { parentPort } from 'worker_threads';
import Utils from '../utils';

console.log('[db-cleanup] started');

Utils.databaseMaintenance().then(() => {
	console.log('[db-cleanup] finished');
	parentPort.postMessage('done');
});
