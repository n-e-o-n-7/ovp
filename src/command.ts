export const Query_COMMAND = {
	name: 'qh',
	description: 'Query Holder',
	options: [
		{
			type: 3,
			name: 'address',
			description: 'By EthAddress',
			required: true,
		},
	],
	type: 1,
};
