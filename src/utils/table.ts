import { IRequest } from 'itty-router';

export async function csvToArray(csv: File): Promise<
	[
		string[],
		{
			[k: string]: string;
		}[]
	]
> {
	const content = await csv.text();
	const allTextLines = content.split(/\r|\n|\r/);
	const headers = allTextLines.shift()?.split(',');
	if (!headers) return [[], []];

	const rows = allTextLines.map((line) => {
		// const values = line
		// 	.split('"')
		// 	.map((t, i) => ({ flag: i % 2 === 0, v: t }))
		// 	.filter((t) => t.v != '')
		// 	.map((t) => {
		// 		if (!t.flag) return [t.v];
		// 		const v = t.v.replace(/^,+/g, '').replace(/,+$/g, '');
		// 		return v.split(',');
		// 	})
		// 	.reduce((o, n) => {
		// 		return o.concat(n);
		// 	}, []);

		const values = line.split(',');
		const res: string[] = [];
		let flag = true;
		let chunk = [];
		//前提:分割后“”成对
		for (let i = 0; i < values.length; i++) {
			if (flag) {
				if (values[i][0] === '"') {
					flag = false;
					chunk.push(values[i]);
				} else {
					res.push(values[i]);
				}
			}
			if (!flag) {
				if (values[i][values[i].length - 1] === '"') {
					flag = true;
					res.push(chunk.join(','));
				} else {
					chunk.push(values[i]);
				}
			}
		}

		return Object.fromEntries(headers.map((key, index) => [key, res[index]]));
	});
	return [headers, rows];
}

export function exportToCsv<Row extends Object>(rows: Row[]) {
	if (!rows || !rows.length) {
		return '';
	}
	const separator = ',';
	const keys = Object.keys(rows[0]);
	const csvContent = keys.join(separator) + '\n' + rows.map((row: Row) => Object.values(row).join(separator)).join('\n');
	return csvContent;
}

export function stringOption(s: string) {
	if (s === 'null' || s === 'undefined') return undefined;
	return s.replace(new RegExp(/(')/g), ' ');
}

export function group<T>(array: T[], subGroupLength: number) {
	var index = 0;
	var newArray = [];

	while (index < array.length) {
		newArray.push(array.slice(index, (index += subGroupLength)));
	}

	return newArray;
}

export async function verifyHeader(request: IRequest) {
	const PRESHARED_AUTH_HEADER_KEY = 'X-Custom-1K';
	const PRESHARED_AUTH_HEADER_VALUE = 'pig';
	const value = request.headers.get(PRESHARED_AUTH_HEADER_KEY);
	if (value != PRESHARED_AUTH_HEADER_VALUE)
		return new Response('Sorry, you have supplied an invalid key.', {
			status: 403,
		});
}
