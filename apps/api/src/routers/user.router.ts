import { Router } from 'express'
import * as userController from '@controllers/user.controller'

const userRouter = Router()

userRouter.get('/', userController.getUsers)
userRouter.post('/', userController.createUser)
userRouter.put('/:id', userController.updateUser)
userRouter.delete('/:id', userController.deleteUser)

export { userRouter }
