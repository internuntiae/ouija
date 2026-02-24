import { Router } from 'express'
import * as userController from '@controllers/user.controller'

const userRouter = Router()

userRouter.get('/', userController.getUsers)
userRouter.get('/:id', userController.getUser)
userRouter.post('/', userController.createUser)

export { userRouter }
