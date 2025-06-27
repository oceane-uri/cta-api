import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { registerUser, loginUser } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerUser); // Seul le superadmin l'utilisera
router.post('/login', loginUser);

// Nouvelle route GET /me
router.get('/me', authMiddleware, (req, res) => {
  // @ts-ignore
  const user = req.user;

  res.json({
    id: user.userId,
    email: user.email, // optionnel : tu peux ne pas l’avoir dans ton JWT
    role: user.role
  });
});

export default router;
