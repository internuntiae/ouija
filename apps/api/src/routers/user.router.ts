import { Router } from 'express'
import * as userController from '@controllers/user.controller'
import { requireAuth } from '@middleware/auth.middleware'

const userRouter = Router()

// All user routes require authentication
userRouter.get('/', requireAuth, userController.getUsers)
userRouter.post('/', requireAuth, userController.createUser)
userRouter.put('/:id', requireAuth, userController.updateUser)
userRouter.delete('/:id', requireAuth, userController.deleteUser)

export { userRouter }
