import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from '~/context/createEmotionCache';
import { ServerStyleContext } from '~/context/context';
import type { EntryContext } from '@remix-run/node';
import { renderToString } from 'react-dom/server';
import { CacheProvider } from '@emotion/react';
import { RemixServer } from '@remix-run/react';

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
) {
	const cache = createEmotionCache();
	const { extractCriticalToChunks } = createEmotionServer(cache);

	const html = renderToString(
		<ServerStyleContext.Provider value={null}>
			<CacheProvider value={cache}>
				<RemixServer context={remixContext} url={request.url} />
			</CacheProvider>
		</ServerStyleContext.Provider>,
	);

	const chunks = extractCriticalToChunks(html);

	const markup = renderToString(
		<ServerStyleContext.Provider value={chunks.styles}>
			<CacheProvider value={cache}>
				<RemixServer context={remixContext} url={request.url} />
			</CacheProvider>
		</ServerStyleContext.Provider>,
	);

	responseHeaders.set('Content-Type', 'text/html');

	return new Response(`<!DOCTYPE html>${markup}`, {
		status: responseStatusCode,
		headers: responseHeaders,
	});
}
