import { IRequest } from 'itty-router';
import { InstallGlobalCommands } from '../utils/discord';
import { Query_COMMAND } from '../command';

export default async function installCommands(request: IRequest, env: Env, ctx: ExecutionContext) {
	await InstallGlobalCommands(env, [Query_COMMAND]);
	return new Response('installed');
}
