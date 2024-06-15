import { VStack, Button, Spinner, Input, useToast, Image, Text, Flex } from '@chakra-ui/react';
import { ServerToClientEvents, ClientToServerEvents } from '~/other/types';
import { json, useLoaderData } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import config from '~/other/config';

export function loader() {
	return json({ url: config.backendUrl, auth: config.authKey });
}

export default function Index() {
	const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
	const { url, auth } = useLoaderData<{ url: string; auth: string; }>();
	const toast = useToast();

	const [showGenerate, setShowGenerate] = useState(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const inputRef = useRef<HTMLInputElement | null>(null);
	const [inputWidth, setInputWidth] = useState('auto');

	const [qrImage, setQrImage] = useState<string | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<{
		username: string;
		avatar: string;
		id: string;
	} | null>(null);

	useEffect(() => {
		if (!inputRef.current) return;
		setInputWidth(`${inputRef.current.scrollWidth + 4}px`);
	}, [token]);

	const connect = () => { setIsLoading(true); setShowGenerate(false); socket?.emit('init'); };
	const kill = () => socket?.close();

	useEffect(() => {
		const connection = io(url, { auth: { token: auth } });
		setSocket(connection);

		connection.on('connect', () => {
			setShowGenerate(true);
			setIsLoading(false);
		});

		connection.on('disconnect', () => {
			setShowGenerate(false);
			setIsLoading(true);
			setUser(null);
			setToken(null);
			setQrImage(null);
			kill();
		});

		return () => {
			connection.close();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!socket) return;

		socket.on('qrCode', (data) => { setQrImage(data); setIsLoading(false); });
		socket.on('user', (data) => { setIsLoading(false); setUser(data); setQrImage(null); });
		socket.on('token', (data) => { setToken(data); setIsLoading(false); });
		socket.on('wsClosed', () => { setIsLoading(true); setQrImage(null); setUser(null); setToken(null); });
		socket.on('cancel', (data) => {
			setUser(null);
			setToken(null);
			setQrImage(null);
			setIsLoading(false);
			setShowGenerate(true);

			toast({
				title: data,
				status: 'error',
				duration: 5000,
				isClosable: true,
			});
		});
		socket.on('error', (data) => {
			toast({
				description: JSON.stringify(data, null, 2),
				status: 'error',
				duration: Infinity,
				isClosable: true,
			});
		});

		return () => {
			socket.off('qrCode');
			socket.off('token');
			socket.off('user');
			socket.off('cancel');
		};
	}, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<VStack w='100%' h='100%' justifyContent='center' alignItems='center'>
			{showGenerate && <Button onClick={() => { connect(); }}>Generate Discord QR</Button>}
			{isLoading && <Spinner size='xl' />}
			{qrImage && <Image w='256px' h='256px' src={qrImage} borderRadius={8} />}
			{user?.id && (
				<Flex
					direction={{ base: 'column', md: 'row' }}
					alignItems='center'
					justifyContent='center'
					borderRadius={8}
					bg='gray.900'
					gap={4}
					py={2}
					px={4}
				>
					<Image w='64px' h='64px' borderRadius='full' src={user.avatar} />
					<Text fontSize='xl' fontWeight='bold'>Logging in as {user.username}..</Text>
				</Flex>
			)}
			{token && (
				<VStack>
					<Input
						ref={inputRef}
						value={token}
						readOnly
						bg='gray.900'
						borderColor={'gray.900'}
						width={inputWidth}
						onFocus={() => {
							window.navigator.clipboard.writeText(token);
							toast({
								title: 'Token Copied!',
								status: 'success',
								duration: 5000,
								isClosable: true,
							});
						}}
						sx={{ cursor: 'pointer' }}
					/>
					<Button
						onClick={() => {
							kill();
							setUser(null);
							setToken(null);
							setQrImage(null);
							connect();
						}}
					>
						Generate New
					</Button>
				</VStack>
			)}
		</VStack>
	);
}
