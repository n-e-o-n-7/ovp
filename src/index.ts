import { Router } from 'itty-router';
import interactions from './routes/interactions';
import { verifyDiscordRequest } from './utils/discord';
import installCommands from './routes/installCommands';
import uploadZealy from './routes/uploadZealy';
import uploadOthers from './routes/uploadOthers';
import { verifyKey } from 'discord-interactions';
import { verifyHeader } from './utils/table';

const router = Router();
router.post('/interactions', verifyDiscordRequest, interactions);
router.all('*', verifyHeader);
router.post('/installCommands', installCommands);
router.post('/uploadZealy', uploadZealy);
router.post('/uploadOthers', uploadOthers);
// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
	fetch: (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => router.handle(request, env, ctx),
};
