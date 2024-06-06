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
