type snowflake = string;
interface Interaction {
	id: snowflake;
	application_id: snowflake;
	name: string;
	type: import('discord-interactions').InteractionType;
	data?: InteractionData;
}

interface InteractionData {
	id: snowflake;
	name: string;
	type: number;
	options?: InteractionDataOption[];
}

interface InteractionDataOption {
	name: string;
	type: number;
	value: string;
}

interface RecordRow {
	EthAddress: string;
	OVP: number;
	Source: string;
	RecordTime: Date;
	Twitter?: string;
	Discord?: string;
	Zealy?: string;
}
