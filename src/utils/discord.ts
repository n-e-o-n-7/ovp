import { verifyKey } from 'discord-interactions';
import { IRequest } from 'itty-router';

export async function verifyDiscordRequest(request: IRequest, env: Env) {
	const signature = request.headers.get('X-Signature-Ed25519');
	const timestamp = request.headers.get('X-Signature-Timestamp');
	const rowBody = await request.text();
	const isValidRequest = verifyKey(rowBody, signature!, timestamp!, env.DISCORD_PUBLIC_KEY);
	if (!isValidRequest) {
		return new Response('Bad', { status: 401 });
	}
	request.data = JSON.parse(rowBody);
}

export async function DiscordRequest(env: Env, endpoint: string, options: RequestInit) {
	const url = 'https://discord.com/api/v10/' + endpoint;
	const res = await fetch(url, {
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`,
			'Content-Type': 'application/json; charset=UTF-8',
			'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
		},
		...options,
	});
	// throw API errors
	if (!res.ok) {
		const data = await res.json();
		console.log(res.status);
		throw new Error(JSON.stringify(data));
	}
	// return original response
	return res;
}

export async function InstallGlobalCommands(env: Env, commands: any) {
	// API endpoint to overwrite global commands
	const endpoint = `applications/${env.DISCORD_APPLICATION_ID}/commands`;

	try {
		// This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
		const res = await DiscordRequest(env, endpoint, { method: 'PUT', body: JSON.stringify(commands) });
		console.log(res.status);
	} catch (err) {
		console.error(err);
	}
}
