import { Router } from 'express'
import * as userController from '@controllers/user.controller'
import { requireAuth } from '@middleware/auth.middleware'
import {
  validateBody,
  createUserSchema,
  updateUserSchema
} from '@middleware/validation.middleware'

const userRouter = Router()

// All user routes require authentication
userRouter.get('/', requireAuth, userController.getUsers)
userRouter.post('/', requireAuth, validateBody(createUserSchema), userController.createUser)
userRouter.put('/:id', requireAuth, validateBody(updateUserSchema), userController.updateUser)
userRouter.delete('/:id', requireAuth, userController.deleteUser)

export { userRouter }
