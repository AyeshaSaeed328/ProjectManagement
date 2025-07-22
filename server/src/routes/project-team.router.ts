import Router from 'express'
import {assignTeamToProject} from '../controllers/projectTeam.controller'

const router = Router()

router.post('/assign', assignTeamToProject)

export default router