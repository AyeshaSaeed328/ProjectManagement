import Router from 'express'
import { assignTeamsToProject } from '../controllers/projectTeam.controller'

const router = Router()

router.post('/assign', assignTeamsToProject)

export default router