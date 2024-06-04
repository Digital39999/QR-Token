import { Flex } from '@chakra-ui/react';

export default function Layout({ children }: { children: React.ReactNode; }) {
	return (
		<Flex flexDir={'column'} w='100%' h='100vh'>
			{children}
		</Flex>
	);
}
