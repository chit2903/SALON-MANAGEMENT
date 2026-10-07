import { User, Customer } from '../models/index.js';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const login = async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const identifier = (email || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = `demo-${user.id}-${Date.now()}`;
    return res.json({ user, token });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Login failed' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, username, email, phone, password, role } = req.body || {};

    const userEmail = (email || '').trim();
    const userUsername = (username || userEmail.split('@')[0] || `user_${Date.now()}`).trim();

    if (!name || !userEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: userEmail }, { username: userUsername }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or username is already registered' });
    }

    const userId = generateId();

    const newUser = new User({
      id: userId,
      name,
      username: userUsername,
      email: userEmail,
      phone: phone || '',
      password,
      role: role || 'user',
    });

    await newUser.save();

    // Automatically create a Customer record so new registration appears in admin panel
    try {
      const existingCustomer = await Customer.findOne({
        $or: [{ id: userId }, { email: userEmail }]
      });

      if (!existingCustomer) {
        const newCustomer = new Customer({
          id: userId,
          name: name,
          email: userEmail,
          phone: phone || '',
          role: role || 'user',
          loyaltyPoints: 0,
          totalVisits: 0,
          joinDate: new Date().toISOString().split('T')[0],
          notes: 'Registered user account',
        });
        await newCustomer.save();
      }
    } catch (custErr) {
      console.warn('[Auth] Failed to create customer profile for new user:', custErr.message);
    }

    const token = `demo-${newUser.id}-${Date.now()}`;
    return res.status(201).json({ user: newUser, token });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Registration failed' });
  }
};
