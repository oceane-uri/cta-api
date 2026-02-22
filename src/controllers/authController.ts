import { Request, Response } from 'express';
import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 16)) {
    throw new Error('JWT_SECRET must be set and at least 16 characters in production');
  }
  return secret || 'secretdevtest';
}

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Email et mot de passe requis' });
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`,
            [email, hashedPassword, role || 'user']
        );

        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        console.error('Erreur registerUser :', error);
        const origin = req.headers.origin;
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (origin) res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const [rows]: any = await pool.query(
            `SELECT * FROM users WHERE email = ? LIMIT 1`,
            [email]
        );

        if (rows.length === 0) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            getJwtSecret(),
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur loginUser :', error);
        // Toujours envoyer CORS sur les erreurs (au cas où la réponse 500 serait vue sans les en-têtes du middleware)
        const origin = req.headers.origin;
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (origin) res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
