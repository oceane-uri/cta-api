import { Request, Response } from 'express';
import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secretdevtest';

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
            { userId: user.id, role: user.role },
            JWT_SECRET,
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
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
