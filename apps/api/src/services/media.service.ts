import path from 'path'
import fs from 'fs'
import * as mediaRepo from '@repositories/media.repository'
import * as userRepo from '@repositories/user.repository'
import { UPLOAD_DIR } from '@middleware/upload.middleware'
import { MediaPurpose } from '@prisma/client'

// ─── Base URL helper ───────────────────────────────────────────────────────────
// In production set the CDN_BASE_URL env variable to the public hostname.
const BASE_URL = process.env.CDN_BASE_URL ?? 'http://localhost:3001'

const buildUrl = (storedName: string) => `${BASE_URL}/api/media/${storedName}`

// ─── Upload a file ─────────────────────────────────────────────────────────────
export const uploadFile = async (
  ownerId: string,
  file: Express.Multer.File,
  purpose: MediaPurpose = MediaPurpose.ATTACHMENT
) => {
  if (!ownerId || !file) throw new Error('ownerId and file are required')

  const owner = await userRepo.getUserById(ownerId)
  if (!owner) throw new Error('user does not exist')

  const storedName = path.basename(file.path)
  const url = buildUrl(storedName)

  return mediaRepo.createMediaFile({
    ownerId,
    filename: file.originalname,
    storedName,
    mimeType: file.mimetype,
    size: file.size,
    purpose,
    url
  })
}

// ─── Upload avatar + update User.avatarUrl ─────────────────────────────────────
export const uploadAvatar = async (
  userId: string,
  file: Express.Multer.File
) => {
  // Create the DB record
  const media = await uploadFile(userId, file, MediaPurpose.AVATAR)

  // Point the user row at the new avatar
  const user = await mediaRepo.setUserAvatar(userId, media.url)

  return { media, user }
}

// ─── Remove avatar ─────────────────────────────────────────────────────────────
export const removeAvatar = async (userId: string) => {
  const owner = await userRepo.getUserById(userId)
  if (!owner) throw new Error('user does not exist')

  if (!owner.avatarUrl) throw new Error('user has no avatar')

  // Find the stored file record by URL suffix
  const storedName = owner.avatarUrl.split('/').pop()!
  const mediaFile = await mediaRepo.getMediaFileByStoredName(storedName)

  if (mediaFile) {
    await deleteMediaFile(mediaFile.id, userId)
  }

  // Unset the avatar URL on the user
  return mediaRepo.setUserAvatar(userId, null)
}

// ─── Get files for a user ──────────────────────────────────────────────────────
export const getFilesByUser = async (
  ownerId: string,
  purpose?: MediaPurpose
) => {
  if (!ownerId) throw new Error('ownerId is required')
  const owner = await userRepo.getUserById(ownerId)
  if (!owner) throw new Error('user does not exist')

  return mediaRepo.getMediaFilesByOwner(ownerId, purpose)
}

// ─── Get single file metadata ──────────────────────────────────────────────────
export const getFileById = async (id: string) => {
  if (!id) throw new Error('id is required')
  const file = await mediaRepo.getMediaFileById(id)
  if (!file) throw new Error('file not found')
  return file
}

// ─── Delete a media file ───────────────────────────────────────────────────────
export const deleteMediaFile = async (id: string, requesterId: string) => {
  const file = await mediaRepo.getMediaFileById(id)
  if (!file) throw new Error('file not found')
  if (file.ownerId !== requesterId)
    throw new Error('forbidden: you do not own this file')

  // Delete from disk
  const filePath = path.join(UPLOAD_DIR, file.storedName)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  // Remove DB record
  return mediaRepo.deleteMediaFile(id)
}
