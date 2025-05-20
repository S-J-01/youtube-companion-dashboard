import express, { Express, Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import { prisma } from '@repo/db/client' 
import { logger } from './utils/logger'
import { requestLogger } from './middleware/requestLogger'
import authRoutes from './routes/auth'
import videoRoutes from './routes/videoRoutes'


dotenv.config()

const app = express()
const port = 8080


app.use(requestLogger)

app.use(express.json())

app.use('/auth', authRoutes)

app.use('/api/video', videoRoutes)

app.get('/', (req: Request, res: Response) => {
  res.json({message:'YouTube Companion Dashboard landing page'})
})


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled Error: ${err.message}`, { 
    stack: err.stack, 
    originalURL: req.originalUrl,
    method: req.method
  })
  res.status(500).json({ message: 'Global error handler called!' })
})

const server = app.listen(port, async () => {
  try {
    await prisma.$connect()
    logger.info('Successfully connected to the database')
    logger.info(`Server is running on http://localhost:${port}`)
  } catch (error) {
    logger.error('Failed to connect to the database', { error })
    process.exit(1) 
  }
})


process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server')
  server.close(async () => {
    logger.info('HTTP server closed')
    try {
      await prisma.$disconnect()
      logger.info('Prisma client disconnected')
    } catch (error) {
      logger.error('Error disconnecting Prisma client', { error })
    }
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server')
  server.close(async () => {
    logger.info('HTTP server closed')
    try {
      await prisma.$disconnect()
      logger.info('Prisma client disconnected')
    } catch (error) {
      logger.error('Error disconnecting Prisma client', { error })
    }
    process.exit(0)
  })
})


