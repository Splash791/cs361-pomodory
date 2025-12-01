import fs from 'fs/promises';
import { existsSync } from 'fs';

const FILE_DIR = './data';
const FILE = FILE_DIR + "/user_profiles.json";
let user_profiles = new Map();

async function connect() {
    try {
        if (!existsSync(FILE_DIR)) await fs.mkdir(FILE_DIR);
        if (!existsSync(FILE)) await fs.writeFile(FILE, JSON.stringify([]), 'utf-8');
        else {
            const data = await fs.readFile(FILE, 'utf8');
            if (data.trim().length > 0) user_profiles = new Map(JSON.parse(data));
        }
    } catch (error) { console.error("Error loading DB", error); }
}

function createEntry(username, password, details) {
    try {
        user_profiles.set(username, { password, details });
        fs.writeFile(FILE, JSON.stringify([...user_profiles], null, 2), 'utf-8');
        return true;
    } catch (err) { return false; }
}

function userExist(username) { return user_profiles.has(username); }

function isValidLogin(username, password) {
    if (user_profiles.has(username)) {
        const user = user_profiles.get(username);
        if (user.password === password) return user.details;
    }
    return null;
}

function getUserProfile(username) {
    if(user_profiles.has(username)) return user_profiles.get(username).details;
    return null;
}

export { connect, userExist, createEntry, isValidLogin, getUserProfile };