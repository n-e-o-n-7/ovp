import { IRequest } from 'itty-router';
import { csvToArray, group, exportToCsv } from '../utils/table';

export default async function uploadOthers(request: IRequest, env: Env) {
	const formData = await request.formData();
	const file = formData.get('file') as unknown as File;
	//check fileType
	if (file.type != 'text/csv') return new Response('error file type', { status: 403 });
	const [headers, rows] = await csvToArray(file);
	const ness = ['EthAddress', 'OVP', 'Source', 'RecordTime', 'Discord'];
	if (!ness.every((item) => headers.includes(item))) return new Response('invalid csv', { status: 403 });
	const regexAddress = /^0x[0-9A-Fa-f]{40}$/;
	const records = rows
		.map((row: any): RecordRow => row as RecordRow)
		.filter((row) => {
			return regexAddress.test(row['EthAddress']);
		});

	const statements = await Promise.all(
		group(records, 10).map(async (part) => {
			const binding = part
				.reduce((r, n) => {
					return (
						r +
						`, ('${n.EthAddress}', ${n.OVP}, '${n.Source}', '${n.RecordTime.toLocaleString()}', '${n.Twitter ?? ''}', '${
							n.Discord ?? ''
						}', '${n.Zealy ?? ''}')`
					);
				}, '')
				.substring(1);
			return env.ovp.prepare(`INSERT INTO Records (EthAddress, OVP, Source, RecordTime, Twitter, Discord, Zealy) VALUES ${binding}`);
		})
	);
	if (statements.length) {
		await env.ovp.batch(statements);
	}
	const nformData = new FormData();
	nformData.append('payload_json', JSON.stringify({ content: '`others:` ` ' + new Date().toUTCString() + ' `' }));
	if (records.length > 0) {
		let dict: { [key: string]: number } = {};
		records.forEach((row) => {
			if (!dict[row.EthAddress]) dict[row.EthAddress] = 0;
			dict[row.EthAddress] += row.OVP;
		});
		const total = Object.entries(dict).map(([key, value]) => ({ address: key, ovp: value }));
		const totalFile = new File([exportToCsv(total)], 'total.csv', {
			type: 'text/csv',
		});
		nformData.append('file1', totalFile);
	}
	const webhook =
		'https://discord.com/api/webhooks/1147746313774043226/PNou4XH4HvFdXWKtAaFuG40gyGnWlizRsmbMGo7Nly-LEjZ1lXPdJE280nWcaj90Sn0K';
	await fetch(webhook, {
		method: 'POST',
		body: nformData,
	});
	return new Response('upload success');
}
