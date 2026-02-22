import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { registerUser, loginUser } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerUser); // Seul le superadmin l'utilisera
router.post('/login', loginUser);

router.get('/me', authMiddleware, (req, res) => {
  const user = (req as express.Request & { user: { userId: number; email?: string; role: string } }).user;
  res.json({
    id: user.userId,
    email: user.email,
    role: user.role,
  });
});

export default router;
