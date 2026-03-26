# Specs

## The App

GIF-Mood is a simple app to post a GIF to express the user mood. There's a timeline for each user, but the timeline is not public. It's not possible to follow, like, share, or see other users posts. Users can share their timeline temporarily, making it accessible to another user, for a time defined by the user sharing, for example 1 day.
The main view to the user is a pile or cards, similar to Twitter, like a timeline, where each post a GIF. The card post has mainly the GIF, but it should include the date posted in the bottom, in a small way, in the time ago format, and when hovered, it should display the full date and time.

### Features

- Register users;
- Login and logout users;
- Update users profile;
- Search GIFs using the GIPHY API;
- Upload GIFS from local device. In this case, store the image in a volume and save the URL in postgres database; You can use /uploads in the docker file and docker compose. Also use @fastify/static to serve these files. Uploaded gifs should be renamed including the user uuid to make it unique;
- Post a GIF from the GIF search, from a URL, or upload from the computer;
- Sharing a user timeline: user can chose to share their private timeline, for a pre-defined timebox. The shared timeline it's not publicly available in the internet, or avaialble to not logged users, it should be visible for anyone with the link, while the expiration time is still valid, not expired. The owner can revoke access manually before the expiration. Users can have only one shareable link. Their timeline are either private, or shared through a known link;
- Users can have a timeline, which will work as an infinite scroll to keep react performant;
- No text or captions are allowed to be added in the posts;
- Posts cannot be edited or deleted;

### Public Pages

- Landing page;
- Login/Register;

### Protected Pages

- Home, where the timeline lives;
- Profile, where users can update their data and picture;

## Tech stack

- Frontend: React 19, TypeScript, Vite, VitePWA plugin, Bootstrap 5;
- Backend: Nodejs 22, Fastify 5, Class Validator, TypeScript. Please use fastify as a plugin;
  - No Zod or TypeBox, only purely class validator;
- Database: Postgres 16, PrismaORM;
- Containers: Dockerfile, Docker compose;

## Validations & Security

- The application works like a client-server app, where the backend is a REST service, and the frontend is a standalone React app. Please create subfolders for these services as needed;
- Authentication JWT token should be stored locally in LocalStorage, and be valid for 24 hours.
- Rate limit. Upload should accept files up to 10 MB size;
- All incoming DTOs should be decorated with class-validator to match the workflow;
- For uploading from the computer, the backend should handle multipart/form-data with @fastify/multipart;
- Proxy the GIPHY search API using the backend, so users can't see the api key;
- For the infinite scroll, use cursor-based pagination (take and cursor) for better performance;
- Create a separate file for all TypeScript types;
- Do not use `any` type at all costs;
- The frontend app should work as a PWA with standalone mode, although no need to support offline mode, only online;
- The UI should be responsible for small devices, mobile, and PC;


## Database Schema

- User
  - id string UUID
  - username string unique
  - email string
  - password (hashed)
  - pictureUrl string (optional)
  - createdAt timestamp
  - updatedAt timestamp
  - disabledAt timestamp

- Post
  - id string UUID
  - userId string
  - gifUrl string
  - source (search/url/upload)
  - createdAt

- ShareLink
  - id string UUID
  - userId string
  - shareToken
  - expiresAt 
