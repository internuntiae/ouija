import { Router } from 'express'
import * as msgController from '@controllers/message.controller'

const msgRouter = Router()

msgRouter.get('/messages', msgController.getAllMessages)
msgRouter.post('/messages', msgController.createMessage)
msgRouter.put('/messages', msgController.updateMessage)
msgRouter.delete('/messages', msgController.deleteMessage)

export { msgRouter }
