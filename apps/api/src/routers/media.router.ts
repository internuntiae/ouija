import { Router } from 'express'
import * as mediaController from '@controllers/media.controller'
import {
  uploadMiddleware,
  avatarMiddleware
} from '@middleware/upload.middleware'

const mediaRouter = Router()

// ─── Serve a file (CDN endpoint) ──────────────────────────────────────────────
// GET /api/media/:storedName
mediaRouter.get('/:storedName', mediaController.serveFile)

// ─── File metadata ─────────────────────────────────────────────────────────────
// GET /api/media/info/:id
mediaRouter.get('/info/:id', mediaController.getFileInfo)

// ─── All files for a user ──────────────────────────────────────────────────────
// GET /api/media/user/:userId?purpose=AVATAR|ATTACHMENT
mediaRouter.get('/user/:userId', mediaController.getUserFiles)

// ─── Upload one or more files ──────────────────────────────────────────────────
// POST /api/media/upload  (multipart/form-data: files[], ownerId)
mediaRouter.post('/upload', uploadMiddleware, mediaController.uploadFiles)

// ─── Avatar endpoints ──────────────────────────────────────────────────────────
// POST   /api/media/avatar/:userId  (multipart/form-data: avatar)
// DELETE /api/media/avatar/:userId
mediaRouter.post(
  '/avatar/:userId',
  avatarMiddleware,
  mediaController.uploadAvatar
)
mediaRouter.delete('/avatar/:userId', mediaController.removeAvatar)

// ─── Delete a file ─────────────────────────────────────────────────────────────
// DELETE /api/media/:id  (body: { requesterId })
mediaRouter.delete('/:id', mediaController.deleteFile)

export { mediaRouter }
