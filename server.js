import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import session from 'express-session';
import * as auth from './auth_model.mjs';

const PORT = process.env.PORT || 33445;
const SECRET = process.env.SECRET || "$uper$ecret";

const app = express();

app.use(express.json());
app.use(express.static('public')); 

app.use(session({
    secret: SECRET,
    resave: true,
    saveUninitialized: false,
    name: 'Group_11.auth',
    cookie: { maxAge: 60 * 60 * 1000 }
}));

function validParams(username, password) {
    return !(typeof (username) !== "string" || username.length < 1 ||
        typeof (password) !== "string" || password.length < 1);
}

app.post('/auth/register', asyncHandler(async (req, res) => {
    const { username, password, details } = req.body;
    let normalizedUsername = username ? username.toLowerCase() : "";
    if (!validParams(normalizedUsername, password)) return res.status(400).json({Error: "Invalid request"});
    if (auth.userExist(normalizedUsername)) return res.status(409).json({Error: "Username taken"});
    const userDetails = details || { bio: "New user" };
    auth.createEntry(normalizedUsername, password, userDetails);
    res.status(201).json({ success: true, message: "Account created" });
}));

app.post('/auth/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    let normalizedUsername = username ? username.toLowerCase() : "";
    const details = auth.isValidLogin(normalizedUsername, password);
    if (!details) return res.status(401).json({Error: "Invalid login"});
    req.session.user = { username: normalizedUsername };
    res.status(200).json({ success: true, user: req.session.user, details });
}));

app.get('/auth/validate-session', asyncHandler(async (req, res) => {
    if (!req.session.user) return res.status(200).json({ authenticated: false });
    const details = auth.getUserProfile(req.session.user.username);
    res.status(200).json({ authenticated: true, user: req.session.user, details });
}));

app.post('/auth/logout', asyncHandler(async (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('Group_11.auth');
        res.status(200).json({ message: 'Logged out' });
    });
}));

app.listen(PORT, async () => {
    await auth.connect();
    console.log(`Node Server running at http://localhost:${PORT}`);
});