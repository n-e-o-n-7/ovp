import { InteractionResponseType, InteractionType } from 'discord-interactions';
import { IRequest } from 'itty-router';
import { Query_COMMAND } from '../command';
class JsonResponse extends Response {
	constructor(body: object, init?: RequestInit) {
		const jsonBody = JSON.stringify(body);
		init = init || {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};
		super(jsonBody, init);
	}
}

export default async function interactions(request: IRequest, env: Env) {
	const { type, id, data } = request.data as Interaction;
	console.log(JSON.stringify(request.data));
	if (type === InteractionType.PING) {
		return new JsonResponse({ type: InteractionResponseType.PONG });
	}

	if (type === InteractionType.APPLICATION_COMMAND) {
		const { name, options } = data || {};

		if (name === Query_COMMAND.name) {
			const address = options![0].value;
			const results = (await env.ovp.prepare("SELECT * FROM Records WHERE EthAddress = '" + address + "'").first()) as RecordRow | null;
			if (results) {
				const content = `Discord: ${results.Discord} \nTwitter: ${results.Twitter}`;
				return new JsonResponse({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content,
					},
				});
			} else {
				return new JsonResponse({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: '查无此人',
					},
				});
			}
		}
	}

	return new Response('hello');
}
