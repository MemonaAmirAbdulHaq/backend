const express=require('express')
const bcrypt = require('bcrypt');
//const mongoose = require('mongoose');
const nodemailer=require('nodemailer');

//const User = require('./models/User');
const User = require('../models/User');
const router=express.Router();


const generateVerificationCode = () => {

    return Math.floor(100000 + Math.random() * 900000).toString();
};
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure:"true",
    auth: {
        user: 'amirmemona68@gmail.com',
        pass: 'fdzwxqketwmkpzhd',
    },
});
// router.post('/forgot-password', async (req, res) => {
//     const { email } = req.body;

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         const verificationCode = generateVerificationCode();
//         user.resetPasswordToken = verificationCode;
//         user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
//         await user.save();

//         // Send verification email
//         const mailOptions = {
//             from: 'amirmemona68@gmail.com',
//             to: email,
//             subject: 'Password Reset Verification Code',
//             text: `Your verification code is: ${verificationCode}`,
//         };

//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 return res.status(500).send(error.toString());
//             }
//             res.status(200).send('Verification code sent');
//         });
//     } catch (error) {
//         res.status(500).send(error.toString());                                                                                                 ``
//     }
// });



router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const verificationCode = generateVerificationCode();
        user.resetPasswordToken = verificationCode;
        user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save();

        // Send verification email
        const mailOptions = {
            from: 'amirmemona68@gmail.com',
            to: email,
            subject: 'Password Reset Verification Code',
            text: `Your verification code is: ${verificationCode}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send(error.toString());
            }
            res.status(200).send('Verification code sent');
        });
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.post('/verify-code', async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        const user = await User.findOne({ email, resetPasswordToken: verificationCode, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).send('Invalid or expired verification code');
        }

        res.status(200).send('Verification code is valid');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.post('/update-password', async (req, res) => {
    const { email, verificationCode, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    try {
        const user = await User.findOne({ email, resetPasswordToken: verificationCode, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).send('Invalid or expired verification code');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).send('Password updated successfully');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

module.exports = router ;

