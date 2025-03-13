// const express = require('express');
// const nodemailer = require('nodemailer');

// const bcrypt=require('bcrypt')
// const User = require('../models/user');
// const router = express.Router();

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     secure:"true",
//     auth: {
//         user: 'amirmemona68@gmail.com',
//         pass: 'fdzwxqketwmkpzhd',
//     },
// });
// // Generate a random verification code
// const generateVerificationCode = () => {
//     // return crypto.randomBytes(3).toString('hex').toUpperCase();
//   return Math.floor(100000 + Math.random() * 900000).toString(); // Random code generation

// };
// // Routes
// router.post('/signup', async (req, res) => {
//     const { name, email } = req.body;

//     try {
//         const verificationCode = generateVerificationCode();
//         const user = new User({ name, email, verificationCode });
//         await user.save();

//         // Send verification email
//         const mailOptions = {
//             from: 'amirmemona68@gmail.com',
//             to: email,
//             subject: 'Verify Your Email',
//             text: `Your verification code is: ${verificationCode}`,
//         };

//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 return res.status(500).send(error.toString());
//             }
//             res.status(200).send('Verification email sent');
//         });
//     } catch (error) {
//         res.status(500).send(error.toString());
//     }
// });
// //verify email
// router.post('/verify-email', async (req, res) => {
//     const { email, verificationCode } = req.body;

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         if (user.verificationCode !== verificationCode) {
//             return res.status(400).send('Invalid verification code');
//         }

//         user.isVerified = true;
//         user.verificationCode = undefined; // Clear the verification code
//         // setTimeout(async () => {
//         //     const unverifiedUser = await User.findById(user._id);
//         //     if (unverifiedUser && !unverifiedUser.isVerified) {
//         //         await User.findByIdAndDelete(unverifiedUser._id);
//         //         console.log("Unverified user deleted after 2 minutes.");
//         //     }
//         // }, 2 * 60 * 1000); 
//         res.status(200).send('Email verified successfully');
//     } catch (error) {
//         res.status(500).send(error.toString());
//     }
// });

// router.post('/confirmpassword', async (req, res) => {
//     try {
//         console.log("Received request body:", req.body); // Debugging log

//         const { name, email, password, confirmPassword } = req.body;

//         if (!name || !email || !password || !confirmPassword) {
//             return res.status(400).json({ message: "All fields are required." });
//         }

//         if (password !== confirmPassword) {
//             return res.status(400).json({ message: "Passwords do not match." });
//         }

//         const existingUser = await User.findOne({ email });
//         if (!existingUser) {
//             return res.status(404).json({ message: "User not found. Please sign up first." });
//         }

//         if (!existingUser.isVerified) {
//             return res.status(400).json({ message: "Email is not verified." });
//         }

//         // Hash the password and update the existing user
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         existingUser.password = hashedPassword;
//         await existingUser.save();

//         console.log("User registered successfully");
//         res.status(201).json({ message: "User registered successfully!" });
//     } catch (error) {
//         console.error("Error while registering user:", error);
//         res.status(500).json({ message: "Server error", error });
//     }
// });




//  module.exports = router;
const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const User = require('../models/User.js');
const router = express.Router();
const cron = require('node-cron'); // Import node-cron

const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: 'amirmemona68@gmail.com',
        pass: 'fdzwxqketwmkpzhd',
    },
});

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random code
};

// Signup route
router.post('/signup', async (req, res) => {
    const { name, email } = req.body;
    try {
        const verificationCode = generateVerificationCode();
        const expiresAt = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

        const user = new User({ name, email, verificationCode, verificationCodeExpires: expiresAt });
        await user.save();

        const mailOptions = {
            from: 'amirmemona68@gmail.com',
            to: email,
            subject: 'Verify Your Email',
            text: `Your verification code is: ${verificationCode}`,
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                return res.status(500).send(error.toString());
            }
            res.status(200).send('Verification email sent');
        });
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Verify email route
router.post('/verify-email', async (req, res) => {
    const { email, verificationCode } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (!user.verificationCode || user.verificationCodeExpires < Date.now()) {
            return res.status(400).send('Verification code expired');
        }

        if (user.verificationCode !== verificationCode) {
            return res.status(400).send('Invalid verification code');
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.status(200).send('Email verified successfully');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Resend verification code route
router.post('/resend-verification-code', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.isVerified) {
            return res.status(400).send('Email is already verified');
        }

        const verificationCode = generateVerificationCode();
        const expiresAt = Date.now() + 10 * 60 * 1000; // New expiration time
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = expiresAt;
        await user.save();

        const mailOptions = {
            from: 'amirmemona68@gmail.com',
            to: email,
            subject: 'Resend Verification Code',
            text: `Your new verification code is: ${verificationCode}`,
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                return res.status(500).send(error.toString());
            }
            res.status(200).send('New verification code sent');
        });
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Confirm password route
router.post('/confirmpassword', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found. Please sign up first.' });
        }

        if (!existingUser.isVerified) {
            return res.status(400).json({ message: 'Email is not verified.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        existingUser.password = hashedPassword;
        await existingUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



cron.schedule('*/5 * * * *', async () => { // Runs every 5 minutes
    try {
        const thirtyMinutesAgo = Date.now() - 10 * 60 * 1000;
        await User.deleteMany({ 
            isVerified: false, 
            createdAt: { $lt: thirtyMinutesAgo } 
        });
        console.log('Unverified users older than 10 minutes deleted');
    } catch (error) {
        console.error('Error deleting unverified users:', error);
    }
});

module.exports = router;
