import { Router } from 'express'
import * as userController from '@controllers/user.controller'

const userRouter = Router()

userRouter.get('/users', userController.getUsers)
userRouter.get('/user', userController.getUser)
userRouter.post('/', userController.createUser)

export { userRouter }
