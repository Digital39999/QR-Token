import { ClientToServerEvents, DiscordMessage, DiscordMessageTypes, RoomData, ServerToClientEvents } from './data/typings';
import { constants, createHash, generateKeyPairSync, privateDecrypt } from 'crypto';
import LoggerModule, { logError } from './modules/logger';
import config, { ConfigSchema } from './data/config';
import { parseZodError } from './modules/functions';
import { Server, Socket } from 'socket.io';
import { WebSocket } from 'ws';
import Fastify from 'fastify';
import QRCode from 'qrcode';

/* ----------------------------------- Process ----------------------------------- */

console.clear();
LoggerModule('Standby', 'Starting API..', 'white');
console.log('');

const check = ConfigSchema.safeParse(config);
if (!check.success) {
	logError(parseZodError(check.error), 'configSchema', 'manager');
	process.exit(39);
}

/* ----------------------------------- Manager ----------------------------------- */

export class Manager {
	public qrRoom = new Map<string, RoomData>();

	private readonly webApp = Fastify();
	private readonly io = new Server<ClientToServerEvents, ServerToClientEvents>(this.webApp.server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
			allowedHeaders: ['Content-Type', 'Authorization'],
			credentials: true,
		},
	});

	constructor () {
		this.init();
	}

	async init() {
		this.webApp.get('/', (_, res) => {
			return res.status(200).send({
				status: 200,
				data: 'Private QR API.',
			});
		});

		this.io.on('connection', async (socket) => {
			const authKey = socket.handshake.auth.token as string;
			if (!authKey || authKey !== config.authKey) return socket.disconnect(true);

			return await this.setupSocket(socket);
		});

		await this.loadHandlers();
		LoggerModule('Standby', 'All systems are ready, Logging:\n', 'white', true);
	}

	private async setupSocket(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
		socket.on('disconnect', () => {
			const roomData = this.qrRoom.get(socket.id);
			if (!roomData) return;

			clearTimeout(roomData.heartId);
			clearTimeout(roomData.timeoutId);

			this.qrRoom.delete(socket.id);
		});

		socket.on('init', async () => {
			const roomData = this.qrRoom.get(socket.id);
			if (roomData) this.qrRoom.delete(socket.id);

			const ws = new WebSocket('wss://remote-auth-gateway.discord.gg/?v=2', {
				origin: 'https://discord.com',
			});

			const keyPair = generateKeyPairSync('rsa', {
				modulusLength: 2048,
				publicKeyEncoding: { type: 'spki', format: 'der' },
				privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
			});

			ws.on('message', async (data) => {
				const parsedData = JSON.parse(data.toString()) as DiscordMessage<DiscordMessageTypes>;

				switch (parsedData.op) {
					case 'hello': {
						const { timeout_ms, heartbeat_interval } = parsedData;
						ws.send(JSON.stringify({ op: 'init', encoded_public_key: keyPair.publicKey.toString('base64') }));

						const heartId = setInterval(() => {
							ws.send(JSON.stringify({ op: 'heartbeat' }));
						}, heartbeat_interval);

						const timeoutId = setTimeout(() => {
							ws.close();
						}, timeout_ms);

						this.qrRoom.set(socket.id, {
							socket,
							ws,
							heartId,
							timeoutId,
						});

						break;
					}
					case 'nonce_proof': {
						const { encrypted_nonce } = parsedData;
						const decryptedNonce = privateDecrypt({ key: keyPair.privateKey, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(encrypted_nonce, 'base64'));
						const nonceHash = createHash('sha256').update(decryptedNonce).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

						ws.send(JSON.stringify({ op: 'nonce_proof', proof: nonceHash }));
						break;
					}
					case 'pending_remote_init': {
						const { fingerprint } = parsedData;
						const fingerprintData = `https://discordapp.com/ra/${fingerprint}`;
						const qrCodeURL = await QRCode.toDataURL(fingerprintData);

						socket.emit('qrCode', qrCodeURL);
						break;
					}
					case 'pending_ticket': {
						const { encrypted_user_payload } = parsedData;
						const decryptedPayload = privateDecrypt({ key: keyPair.privateKey, oaepHash: 'sha256' }, Buffer.from((encrypted_user_payload), 'base64'));
						const userPayload = decryptedPayload.toString().split(':');

						socket.emit('user', {
							username: userPayload[3] as string,
							avatar: `https://cdn.discordapp.com/avatars/${userPayload[0]}/${userPayload[2]}.${userPayload[2]?.startsWith('a_') ? 'gif' : 'png'}`,
							id: userPayload[0] as string,
						});
						break;
					}
					case 'pending_login': {
						let { ticket } = parsedData;

						const realToken = await fetch('https://discord.com/api/v9/users/@me/remote-auth/login', {
							method: 'POST',
							headers: {
								'Accept': '*/*',
								'Accept-Language': 'en-US',
								'Content-Type': 'application/json',
								'Sec-Fetch-Dest': 'empty',
								'Sec-Fetch-Mode': 'cors',
								'Sec-Fetch-Site': 'same-origin',
								'X-Debug-Options': 'bugReporterEnabled',
								'X-Super-Properties': 'ewogICJvcyI6ICJXaW5kb3dzIiwKICAiY2xpZW50X2J1aWxkX251bWJlciI6IDE1MjQ1MAp9',
								'X-Discord-Locale': 'en-US',
								'User-Agent': 'Discord (https://discord.com, 0.1)',
								'Referer': 'https://discord.com/channels/@me',
								'Connection': 'keep-alive',
								'Origin': 'https://discord.com',
							},
							body: JSON.stringify({
								ticket,
							}),
						}).then((res) => res.json()).catch(() => null) as { encrypted_token: string } | null;

						if (!realToken) return socket.emit('cancel', 'Failed to fetch token.');
						else ticket = privateDecrypt({ key: keyPair.privateKey, oaepHash: 'sha256' }, Buffer.from(realToken.encrypted_token, 'base64')).toString();

						socket.emit('token', ticket);
						break;
					}
					case 'cancel': {
						socket.emit('cancel', 'Action Cancelled.');
						break;
					}
				}

				return;
			});

			ws.on('close', () => {
				const roomData = this.qrRoom.get(socket.id);
				if (!roomData) return;

				clearTimeout(roomData.heartId);
				clearTimeout(roomData.timeoutId);

				this.setupSocket(socket);
			});

			ws.on('error', (err) => {
				logError(err, 'wsError', 'manager');
			});

			this.qrRoom.set(socket.id, {
				socket,
				ws,
			});
		});
	}

	private async loadHandlers() {
		this.webApp.options('*', (_, res) => {
			return res.status(200).send({
				status: 200,
				data: 'Success.',
			});
		});

		this.webApp.setNotFoundHandler((_, res) => {
			return res.status(404).send({
				status: 404,
				error: 'Route not found.',
			});
		});

		this.webApp.setErrorHandler((err, _, res) => {
			return res.status(500).send({
				status: 500,
				error: 'Internal server error (' + err.message + ').',
			});
		});

		return new Promise<void>((resolve) => {
			this.webApp.listen({
				host: '0.0.0.0',
				port: 3003,
			}, (err) => {
				if (err) return logError(err, 'loadWebApp', 'manager');
				LoggerModule('API', 'API is listening on port 8080.', 'green');
				resolve();
			});
		});
	}
}

/* ----------------------------------- Init ----------------------------------- */

const manager = new Manager();
export default manager;

/* ----------------------------------- Errors ----------------------------------- */

process.on('unhandledRejection', (error: Error) => logError(error, 'unhandledRejection', 'manager'));
process.on('uncaughtException', (error: Error) => logError(error, 'uncaughtException', 'manager'));
process.on('warning', (error: Error) => logError(error, 'warning', 'manager'));
