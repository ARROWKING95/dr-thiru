import express from 'express';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();

// GET /api/auth/users
router.get('/users', async (req, res) => {
  try {
    const users = await dbStore.getUsers();
    // Do not return raw passwords in list
    const safeUsers = users.map(({ password, ...u }) => u);
    res.json({ success: true, users: safeUsers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const user = await dbStore.findUser(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Direct password match (or password123 default)
    if (user.password && password && user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    await dbStore.logAction('USER_LOGIN', user.username, user.role || user.profession, { username });

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      user: safeUser,
      token: `token_${user.username}_${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, first_name, last_name, profession, institution, pharmacistRegId, password } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const existing = await dbStore.findUser(username);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    const newUser = {
      id: `user_${Date.now()}`,
      username,
      email: email || '',
      first_name: first_name || '',
      last_name: last_name || '',
      profession: profession || 'doctor',
      institution: institution || 'General Hospital',
      pharmacistRegId: pharmacistRegId || '',
      password: password || 'password123',
      role: profession === 'doctor' ? 'doctor' : 'pharmacist'
    };

    const saved = await dbStore.createUser(newUser);
    await dbStore.logAction('USER_REGISTERED', saved.username, saved.role, { username });

    const { password: _, ...safeUser } = saved;
    res.status(201).json({
      success: true,
      user: safeUser,
      token: `token_${saved.username}_${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    // Default to dr.thirumalai if not specified
    const user = await dbStore.findUser('dr.thirumalai');
    if (!user) {
      return res.status(404).json({ success: false, error: 'Default user not found' });
    }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
