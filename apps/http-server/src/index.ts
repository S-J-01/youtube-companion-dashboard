import express from 'express'
import { google } from 'googleapis';
import dotenv from 'dotenv'
dotenv.config()
import { prisma } from '@repo/db/client'
import { Request,Response } from 'express';

const app = express()
app.use(express.json())

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
)


const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
let tokens:string | null = null;

// Auth URL
app.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    scope: ['https://www.googleapis.com/auth/youtube'],
    access_type: 'offline',
    prompt: 'consent',
  });
  res.json({ authUrl: url });
});



app.listen(3001)