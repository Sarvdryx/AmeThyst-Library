import express from 'express';
import { optionalAuth, verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';
import { validateCreateStudyGroup, validateInvitation, validateJoinRequest, validatePagination, validateStudyGroupParams, validateUpdateStudyGroup } from '../middlewares/study-group.middlewares.mjs';
import * as controller from '../controllers/study-group.controllers.mjs';

const router = express.Router();

router.get('/', optionalAuth, validatePagination, controller.listStudyGroupsController);
router.post('/', verifyToken, authorizeRole('user'), validateCreateStudyGroup, controller.createStudyGroupController);
router.get('/created', verifyToken, validatePagination, controller.listCreatedStudyGroupsController);
router.get('/joined', verifyToken, validatePagination, controller.listJoinedStudyGroupsController);
router.get('/invitations', verifyToken, controller.listStudyGroupInvitationsController);
router.get('/:groupId', optionalAuth, validateStudyGroupParams, controller.getStudyGroupController);
router.patch('/:groupId', verifyToken, validateStudyGroupParams, validateUpdateStudyGroup, controller.updateStudyGroupController);
router.post('/:groupId/requests', verifyToken, authorizeRole('user'), validateStudyGroupParams, validateJoinRequest, controller.requestToJoinController);
router.delete('/:groupId/requests/:requestId', verifyToken, validateStudyGroupParams, controller.cancelJoinRequestController);
router.post('/:groupId/requests/:requestId/approve', verifyToken, validateStudyGroupParams, controller.approveJoinRequestController);
router.post('/:groupId/requests/:requestId/deny', verifyToken, validateStudyGroupParams, controller.denyJoinRequestController);
router.delete('/:groupId/members/:userId', verifyToken, validateStudyGroupParams, controller.removeStudyGroupMemberController);
router.delete('/:groupId/membership', verifyToken, validateStudyGroupParams, controller.leaveStudyGroupController);
router.post('/:groupId/dissolve', verifyToken, validateStudyGroupParams, controller.dissolveStudyGroupController);
router.post('/:groupId/invitations', verifyToken, authorizeRole('user'), validateStudyGroupParams, validateInvitation, controller.inviteStudyGroupMemberController);
router.post('/:groupId/invitations/:requestId/accept', verifyToken, validateStudyGroupParams, controller.acceptStudyGroupInvitationController);
router.post('/:groupId/invitations/:requestId/deny', verifyToken, validateStudyGroupParams, controller.denyStudyGroupInvitationController);

export default router;
