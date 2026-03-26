import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GiphySearchResponse } from '../../types/index';

interface GiphySearchQuery {
  q: string;
  limit?: string;
  offset?: string;
}

export default async function giphyRoutes(app: FastifyInstance): Promise<void> {
  // GET /giphy/search?q=&limit=&offset=
  app.get<{ Querystring: GiphySearchQuery }>(
    '/search',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { q, limit = '20', offset = '0' } = request.query;

      if (!q || q.trim().length === 0) {
        return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Query parameter q is required' });
      }

      const apiKey = process.env.GIPHY_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error', message: 'GIPHY not configured' });
      }

      const parsedLimit = Math.min(parseInt(limit, 10) || 20, 50);
      const parsedOffset = parseInt(offset, 10) || 0;

      const url = new URL('https://api.giphy.com/v1/gifs/search');
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('q', q.trim());
      url.searchParams.set('limit', String(parsedLimit));
      url.searchParams.set('offset', String(parsedOffset));
      url.searchParams.set('rating', 'g');
      url.searchParams.set('lang', 'en');

      const response = await fetch(url.toString());
      if (!response.ok) {
        return reply
          .status(502)
          .send({ statusCode: 502, error: 'Bad Gateway', message: 'Failed to fetch from GIPHY' });
      }

      const giphyData = (await response.json()) as GiphySearchResponse;
      return reply.send(giphyData);
    },
  );
}
