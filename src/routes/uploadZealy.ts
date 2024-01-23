import { IRequest } from 'itty-router';
import { csvToArray, stringOption, group, exportToCsv } from '../utils/table';

export default async function uploadZealy(request: IRequest, env: Env) {
	const formData = await request.formData();
	const file = formData.get('file') as unknown as File;
	//check fileType
	if (file.type != 'text/csv') return new Response('error file type', { status: 403 });

	const [headers, rows] = await csvToArray(file);
	//checkheader
	const ness = [
		'status',
		'user_name',
		'user_id',
		'discord_handle',
		'twitter_username',
		'ethereum address',
		'reward',
		'quest_name',
		'quest_id',
		'review_date',
		'claimed_at',
	];
	if (!ness.every((item) => headers.includes(item))) return new Response('invalid csv', { status: 403 });

	//checkdata

	const lastTime = JSON.parse((await env.zealy.get('last')) ?? '{}');
	const nowTime = { ...lastTime };

	let errorAddress: Object[] = [];
	const regexAddress = /^0x[0-9A-Fa-f]{40}$/;
	const records = rows
		.filter((row: any) => {
			if (row['status'] != 'success') return false;

			if (row['reward'] === 'undefined') return false;

			let date = new Date(row['review_date']);
			if (isNaN(date.getTime())) {
				date = new Date(row['claimed_at']);
			}
			if (isNaN(date.getTime())) return false;

			const quest = row['quest_id'];
			const last = new Date(lastTime[quest] ?? 0);
			const now = new Date(nowTime[quest] ?? 0);
			if (date <= last) return false;
			if (date > now) nowTime[quest] = date;

			if (!regexAddress.test(row['ethereum address'])) {
				errorAddress.push({ ...row });
				return false;
			}

			return true;
		})
		.reduce(
			(
				arr: {
					[k: string]: string;
				}[],
				n
			) => {
				if (arr.length === 0) return [n];
				const last = arr[arr.length - 1];
				const compare = ['ethereum address', 'quest_id', 'review_date', 'claimed_at'];
				for (let prop of compare) {
					if (last[prop] != n[prop]) return [...arr, n];
				}
				return arr;
			},
			[]
		)
		.map(
			(row: any): RecordRow => ({
				EthAddress: row['ethereum address'],
				OVP: parseInt(row['reward'].replace('OVP', '')),
				Source: row['quest_name'],
				RecordTime: new Date(row['review_date'] === 'null' ? row['claimed_at'] : row['review_date']),
				Twitter: stringOption(row['twitter_username']),
				// Discord: stringOption(row['discord_handle']),
				Discord: undefined,
				Zealy: stringOption(row['user_name']),
			})
		);

	console.log(records.length);
	//inset db
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

	await env.zealy.put('last', JSON.stringify(nowTime));

	const nformData = new FormData();
	nformData.append(
		'payload_json',
		JSON.stringify({
			content: new Date().toUTCString() + '\n' + (records.length > 0 ? '`total.csv`' : '') + (errorAddress.length > 0 ? '`error.csv`' : ''),
		})
	);

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

	if (errorAddress.length > 0) {
		const error = errorAddress.map(
			(row: any): RecordRow => ({
				Discord: stringOption(row['discord_handle']),
				EthAddress: row['ethereum address'],
				OVP: parseInt(row['reward'].replace('OVP', '')),
				Source: row['quest_name'].replace("'", "''"),
				RecordTime: new Date(row['review_date'] === 'null' ? row['claimed_at'] : row['review_date']),
				Twitter: stringOption(row['twitter_username']),
				Zealy: stringOption(row['user_name']),
			})
		);
		const errorFile = new File([exportToCsv(error)], 'error.csv', {
			type: 'text/csv',
		});
		nformData.append('file2', errorFile);
	}

	const webhook =
		'https://discord.com/api/webhooks/1147746313774043226/PNou4XH4HvFdXWKtAaFuG40gyGnWlizRsmbMGo7Nly-LEjZ1lXPdJE280nWcaj90Sn0K';
	await fetch(webhook, {
		method: 'POST',
		body: nformData,
	});

	return new Response('upload success');
}
