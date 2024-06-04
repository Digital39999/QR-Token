import { extendTheme } from '@chakra-ui/react';
import colors from './colors';
import tokens from './tokens';

export default extendTheme({
	config: {
		initialColorMode: 'dark',
		useSystemColorMode: true,
		disableTransitionOnChange: false,
	},
	styles: {
		global: {
			body: {
				transitionProperty: 'background-color',
				transitionDuration: '0.4s',
			},
		},
	},
	colors,
	semanticTokens: tokens,
});
