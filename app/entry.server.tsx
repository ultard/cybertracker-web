import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import type { EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';

const ABORT_DELAY = 5000;

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext
) {
	const abortController = new AbortController();
	const timeout = setTimeout(() => abortController.abort(), ABORT_DELAY);

	const stream = await renderToReadableStream(
		<ServerRouter context={routerContext} url={request.url} />,
		{
			signal: abortController.signal,
			onError(error: unknown) {
				console.error(error);
				responseStatusCode = 500;
			}
		}
	);

	if (isbot(request.headers.get('user-agent') || '')) {
		await stream.allReady;
	}

	clearTimeout(timeout);

	responseHeaders.set('Content-Type', 'text/html');

	return new Response(stream, {
		headers: responseHeaders,
		status: responseStatusCode
	});
}
