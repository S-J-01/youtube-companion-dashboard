import { Router, Request, Response } from 'express'
import { Credentials } from 'google-auth-library' 
import { oauth2Client, SCOPES } from '../config/youtube'
import { logger } from '../utils/logger'

const router: Router = Router()


let googleTokens: Credentials | null = null 


router.get('/youtube', (req: Request, res: Response): void => {
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: SCOPES,

  })
  logger.info('Redirecting to Google for authentication for YouTube')
  res.redirect(authorizeUrl)
})


router.get('/google/callback', async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string

  if (!code) {
    logger.error('Authentication callback received no code from Google')
    res.status(400).json({ message: 'Authentication failed: No code provided' })
    return 
  }

  try {
    logger.info('Received code from Google, exchanging for tokens')
    const { tokens: receivedTokens } = await oauth2Client.getToken(code)
    logger.info('Tokens received successfully from Google')

    googleTokens = receivedTokens 
    oauth2Client.setCredentials(receivedTokens) 

    
    logger.info('YouTube authentication successful, tokens stored.')
    
    res.status(200).json({ message: 'Authentication successful! You can close this page.' })
  } catch (error:any) {
    logger.error('Error exchanging code for tokens or setting credentials', { 
      message: error.message, 
      stack: error.stack,
      response: error.response?.data 
    })
    
    res.status(500).json({ message: 'Authentication failed during token exchange.' })
  }
})


router.get('/youtube/tokens', (req: Request, res: Response): void => {
  if (googleTokens) {
    
    res.json({ authenticated: true, message: "Tokens are present (in memory)" })
  } else {
    res.status(401).json({ authenticated: false, message: "No tokens found. Please authenticate via /auth/youtube" })
  }
})



export default router 