const express = require('express');
const User = require('../models/User.js');
const bcrypt=require('bcrypt');
const router = express.Router();
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(401).send('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid credentials');
        }

        if (!user.isVerified) {
            return res.status(401).send('Email not verified');
        }

        res.status(200).send('Login successful');
    } catch (error) {
        res.status(500).send(error.message);
    }
});
module.exports = router;