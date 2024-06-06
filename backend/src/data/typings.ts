import { Socket } from 'socket.io';
import { WebSocket } from 'ws';

export type RoomData = {
	socket: Socket<ClientToServerEvents, ServerToClientEvents>;
	ws: WebSocket;

	didInit?: boolean;

	heartId?: NodeJS.Timeout;
	timeoutId?: NodeJS.Timeout;
};

// For: socket.emit or io.to().emit, io.emit
export type ServerToClientEvents = {
	qrCode: (data: string) => unknown;
	token: (data: string) => unknown;
	user: (data: {
		username: string;
		avatar: string;
		id: string;
	}) => unknown;

	cancel: (message: string) => unknown;
	wsClosed: () => unknown;
}

// For: socket.on
export type ClientToServerEvents = {
	init: () => unknown;
}

export type DiscordMessageTypes = 'hello' | 'init' | 'heartbeat' | 'heartbeat_ack' | 'nonce_proof' | 'pending_remote_init' | 'pending_ticket' | 'pending_login' | 'cancel';
export type DiscordMessage<T extends DiscordMessageTypes> = T extends 'hello'
	? {
		op: T;
		timeout_ms: number;
		heartbeat_interval: number;
	}
	: T extends 'init'
	? {
		op: T;
		encoded_public_key: string;
	}
	: T extends 'nonce_proof'
	? {
		op: T;
		encrypted_nonce: string;
	}
	: T extends 'pending_remote_init'
	? {
		op: T;
		fingerprint: string;
	}
	: T extends 'pending_ticket'
	? {
		op: T;
		encrypted_user_payload: string;
	}
	: T extends 'pending_login'
	? {
		op: T;
		ticket: string;
	}
	: T extends 'heartbeat' | 'heartbeat_ack' | 'cancel' ? {
		op: T;
	} : never;
