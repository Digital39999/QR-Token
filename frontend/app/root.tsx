import { LinksFunction, MetaFunction } from '@remix-run/node';
import { cssBundleHref } from '@remix-run/css-bundle';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '~/components/theme/base';
import { Outlet } from '@remix-run/react';
import Layout from '~/components/Layout';
import { Document } from '~/document';

import '~/styles/global.css';

export const links: LinksFunction = () => [
	...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
	{ rel: 'icon', href: '/qr.png' },
];

export const meta: MetaFunction = () => {
	return [
		{ charset: 'utf-8' },
		{ name: 'viewport', content: 'width=device-width, initial-scale=1' },

		{ title: 'QR' },
		{ name: 'description', content: 'Get your discord token if you quickly need it.' },

		{ property: 'og:title', content: 'QR' },
		{ property: 'og:description', content: 'Get your discord token if you quickly need it.' },
		{ property: 'og:image', content: '/qr.png' },

		{ name: 'twitter:title', content: 'QR' },
		{ name: 'twitter:description', content: 'Get your discord token if you quickly need it.' },
		{ name: 'twitter:image', content: '/qr.png' },
	];
};

export default function App() {
	return (
		<Document>
			<ChakraProvider theme={theme}>
				<Layout>
					<Outlet />
				</Layout>
			</ChakraProvider>
		</Document>
	);
}
