import { Router } from 'express'
import * as msgController from '../controllers/message.controller'

const msgRouter = Router()

msgRouter.get('/messages', msgController.getAllMessages)
msgRouter.post('/message', msgController.createMessage)
msgRouter.put('/message', msgController.updateMessage)
msgRouter.delete('/message', msgController.deleteMessage)

export { msgRouter }
