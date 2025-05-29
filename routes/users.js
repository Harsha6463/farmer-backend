import express from 'express';
import { auth } from '../middleware/auth.js';
import UserController from '../controllers/users.js';

const router = express.Router();

router.get('/profile', auth, (req, res) => {
  const userController = new UserController();
  userController.getProfile(req, res);
});

router.put('/profile', auth, (req, res) => {
  const userController = new UserController();
  userController.updateProfile(req, res);
});

router.put('/change-password', auth, (req, res) => {
  const userController = new UserController();
  userController.changePassword(req, res);
});

export default router;
