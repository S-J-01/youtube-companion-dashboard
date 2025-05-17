import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  
  logger.info(`Request: ${req.method} ${req.originalUrl}`)
  next()
} 