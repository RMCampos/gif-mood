export interface AuthContextValue {
  token: string | null;
  user: JwtPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export type PostSource = 'SEARCH' | 'URL' | 'UPLOAD';

export interface User {
  id: string;
  username: string;
  email: string;
  pictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  gifUrl: string;
  source: PostSource;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  userId: string;
  shareToken: string;
  expiresAt: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface GiphyImage {
  url: string;
  width: string;
  height: string;
}

export interface GiphyGif {
  id: string;
  title: string;
  images: {
    original: GiphyImage;
    fixed_height: GiphyImage;
    downsized: GiphyImage;
  };
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

export interface AuthResponse {
  token: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}
