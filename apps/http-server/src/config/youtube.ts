import { OAuth2Client } from 'google-auth-library'
import dotenv from 'dotenv'

dotenv.config()


if (!process.env.YOUTUBE_CLIENT_ID) {
  throw new Error('YOUTUBE_CLIENT_ID is not defined in environment variables')
}

if (!process.env.YOUTUBE_CLIENT_SECRET) {
  throw new Error('YOUTUBE_CLIENT_SECRET is not defined in environment variables')
}

if (!process.env.YOUTUBE_REDIRECT_URI) {
  throw new Error('YOUTUBE_REDIRECT_URI is not defined in environment variables')
}

export const oauth2Client = new OAuth2Client(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);


export const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];
