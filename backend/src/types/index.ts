export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AuthenticatedUser {
  sub: string;
  username: string;
  email: string;
}

export interface GiphyImage {
  url: string;
  width: string;
  height: string;
}

export interface GiphyImages {
  original: GiphyImage;
  fixed_height: GiphyImage;
  downsized: GiphyImage;
}

export interface GiphyGif {
  id: string;
  title: string;
  images: GiphyImages;
  url: string;
}

export interface GiphySearchResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}
