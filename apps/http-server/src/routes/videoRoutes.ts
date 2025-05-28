import { Router, Request, Response, NextFunction } from 'express'
import { google } from 'googleapis'
import { oauth2Client } from '../config/youtube' 
import { logger } from '../utils/logger'

const router: Router = Router()


const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
    next()
    return
  }
  logger.warn('Attempted to access protected route without authentication')
  res.status(401).json({ message: 'Unauthorized. Please authenticate via /auth/youtube first.' })
}


router.get('/details', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  const videoId = process.env.YOUTUBE_VIDEO_ID_TO_MANAGE

  if (!videoId) {
    logger.error('YOUTUBE_VIDEO_ID_TO_MANAGE is not set in environment variables')
    res.status(500).json({ message: 'Server configuration error: Video ID not set.' })
    return
  }

  try {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    
    logger.info(`Fetching details for video ID: ${videoId}`)
    const response = await youtube.videos.list({
      part: ['snippet', 'statistics', 'status'],
      id: [videoId],
    })

    if (!response.data.items || response.data.items.length === 0) {
      logger.warn(`No video found with ID: ${videoId}`)
      res.status(404).json({ message: 'Video not found.' })
      return
    }

    const videoDetails = response.data.items[0]
    logger.info(`Successfully fetched details for video: ${videoDetails?.snippet?.title || '[No Title]'}`)
    res.json(videoDetails)

  } catch (error: any) {
    logger.error('Error fetching video details from YouTube API', {
      message: error.message,
      stack: error.stack,
      videoId: videoId,
      response: error.response?.data
    })

    if (error.response?.status === 401 || error.response?.status === 403) {
        res.status(error.response.status).json({ message: 'YouTube API authentication error. Please re-authenticate.', error: error.response?.data })
        return
    }
    res.status(500).json({ message: 'Failed to fetch video details.', error: error.message })
  }
})


router.put('/details', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  const videoId = process.env.YOUTUBE_VIDEO_ID_TO_MANAGE
  const { title, description } = req.body

  if (!videoId) {
    logger.error('YOUTUBE_VIDEO_ID_TO_MANAGE is not set in environment variables')
    res.status(500).json({ message: 'Server configuration error: Video ID not set.' })
    return
  }

  if (!title && !description) {
    res.status(400).json({ message: 'Bad Request: Please provide a title or description to update.' })
    return
  }

  try {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

   
    logger.info(`Fetching current details for video ID: ${videoId} before update`)
    const videoListResponse = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    })

    if (!videoListResponse.data.items || videoListResponse.data.items.length === 0) {
      logger.warn(`No video found with ID: ${videoId} for update`)
      res.status(404).json({ message: 'Video not found for update.' })
      return
    }
    
    const firstItem = videoListResponse.data.items[0]

    if (!firstItem || !firstItem.snippet) {
        logger.error('Video item or its snippet is missing in the YouTube API response.', { videoId })
        res.status(500).json({ message: 'Failed to retrieve essential video snippet data for update.'})
        return
    }

    const currentSnippet = firstItem.snippet

    if (!currentSnippet.categoryId) { 
        logger.error('Could not retrieve categoryId for the video.', { videoId })
        res.status(500).json({ message: 'Failed to retrieve essential video data (categoryId) for update.' })
        return
    }

    
    const resource = {
      id: videoId,
      snippet: {
        title: title || currentSnippet.title, 
        description: description || currentSnippet.description, 
        categoryId: currentSnippet.categoryId, 
      },
    }

    logger.info(`Updating video ID: ${videoId} with new title/description`)
    const updateResponse = await youtube.videos.update({
      part: ['snippet'],
      requestBody: resource,
    })

    if (updateResponse.data && updateResponse.data.snippet) {
      const snippet = updateResponse.data.snippet
      logger.info(`Successfully updated video: ${snippet.title || '[No Title]'}`)
      res.json(updateResponse.data)
    } else {
      logger.error('YouTube API did not return expected data after update.', { videoId: videoId, responseData: updateResponse.data })
      res.status(500).json({ message: 'Video update seemed successful but no valid data returned from YouTube.'})
    }

  } catch (error: any) {
    logger.error('Error updating video details via YouTube API', {
      message: error.message,
      stack: error.stack,
      videoId: videoId,
      response: error.response?.data
    })

    if (error.response?.status === 401 || error.response?.status === 403) {
      res.status(error.response.status).json({ message: 'YouTube API authentication/authorization error. Please re-authenticate.', error: error.response?.data })
      return
    }
    res.status(500).json({ message: 'Failed to update video details.', error: error.message })
  }
})


router.get('/comments', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  const videoId = process.env.YOUTUBE_VIDEO_ID_TO_MANAGE

  if (!videoId) {
    logger.error('YOUTUBE_VIDEO_ID_TO_MANAGE is not set in environment variables for fetching comments')
    res.status(500).json({ message: 'Server configuration error: Video ID not set.' })
    return
  }

  try {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

    logger.info(`Fetching comment threads for video ID: ${videoId}`)
    const response = await youtube.commentThreads.list({
      part: ['snippet', 'replies'], 
      videoId: videoId,
      maxResults: 50, 
      order: 'time', 
    
    })

    if (!response.data.items) {
      logger.warn(`No comment threads found or API error for video ID: ${videoId}`)
      
      res.json([]) 
      return
    }

    logger.info(`Successfully fetched ${response.data.items.length} comment threads for video ID: ${videoId}`)
    res.json(response.data.items) 

  } catch (error: any) {
    logger.error('Error fetching video comments from YouTube API', {
      message: error.message,
      stack: error.stack,
      videoId: videoId,
      response: error.response?.data
    })

    if (error.response?.status === 401 || error.response?.status === 403) {
      res.status(error.response.status).json({ message: 'YouTube API authentication/authorization error. Please re-authenticate.', error: error.response?.data })
      return
    }
    res.status(500).json({ message: 'Failed to fetch video comments.', error: error.message })
  }
})

export default router 