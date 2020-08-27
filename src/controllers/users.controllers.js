import users from '../models/users.models';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {} from 'dotenv/config';
const cloudinary = require('cloudinary').v2;

cloudinary.config({
	cloud_name: 'julesntare',
	api_key: '658528737163627',
	api_secret: '_rLWat1SCgg0NMVSZ6myvZO99-Y',
});

const { SECRET_KEY } = process.env;
const getAllUsers = (req, res) => {
	res.status(200).json(users);
};

const getUserById = (req, res) => {
	let id = req.params.id;
	let user = users.filter((user) => user.id === id);
	if (user.length === 0) {
		return res.status(404).json({ msg: 'User Not found' });
	}
	res.status(200).json(user);
};

const getHashedPassword = (password) => {
	const sha256 = crypto.createHash('sha256');
	const hash = sha256.update(password).digest('base64');
	return hash;
};

const createUser = (req, res) => {
	let newUser = {};
	let { firstname, lastname, email, password } = req.body;

	const checkUser = users.filter((user) => user.email === email);
	if (checkUser.length > 0) {
		return res.status(409).json({ message: 'Email already in use' });
	}

	if (Object.keys(req.body).length === 0) {
		return res.status(500).json({ msg: 'Provide some data' });
	}
	let token = jwt.sign({ email, level: 2 }, SECRET_KEY, { algorithm: 'HS256' });
	newUser.id = uuidv4();
	newUser.firstname = firstname;
	newUser.lastname = lastname;
	newUser.email = email;
	newUser.password = getHashedPassword(password);
	newUser['profile-img-url'] = null;
	newUser.noOfEntries = 1;
	newUser.level = 2;
	newUser.joined = new Date();

	users.push(newUser);
	res.json({ msg: 'User Added Successfully', token });
};

const loginUser = (req, res) => {
	let { email, password } = req.body;
	password = getHashedPassword(password);
	let loginInfo = users.filter((user) => user.email === email);
	email = loginInfo[0].email;
	let level = loginInfo[0].level;
	let token = jwt.sign({ email, level }, SECRET_KEY, { algorithm: 'HS256' });
	if (loginInfo.length === 0) {
		return res.status(404).json({ message: 'User not Found' });
	}
	if (getHashedPassword(loginInfo[0].password) !== getHashedPassword(password)) {
		return res.status(404).json({ message: 'Invalid Password' });
	}
	res.status(200).json({ data: loginInfo, token });
};

const deleteUser = (req, res) => {
	let id = req.params.id;
	let found = users.find((user) => user.id === id);
	if (found == undefined) {
		return res.status(404).json({ msg: 'No user to delete' });
	}
	users.splice(users.indexOf(found), 1);
	res.json(users);
};

const updateUserInfo = (req, res) => {
	let id = req.params.id;
	let found = users.find((user) => user.id === id);
	if (found === undefined) {
		return res.status(500).json({ msg: 'No user to edit' });
	}
	if (req.body.password) {
		return res.status(404).json({ msg: "can't change password" });
	}
	if (req.file) {
		const path = req.file.path;
		cloudinary.uploader.upload(path, (err, image) => {
			if (err) return res.status(404).json(err);
			const fs = require('fs');
			fs.unlinkSync(path);
			if (image) {
				users.splice(users.indexOf(found), 1, {
					...found,
					...req.body,
					[req.file.fieldname]: image.url,
				});
			}
		});
	} else {
		users.splice(users.indexOf(found), 1, { ...found, ...req.body });
	}
	res.status(200).json(users);
};

const changePassword = (req, res) => {
	let id = req.params.id;
	let { currpass, newpass, cpass } = req.body;
	let found = users.find((user) => user.id === id);
	console.log(found.password);
	console.log(getHashedPassword(currpass));
	if (Object.keys(req.body).length === 0) {
		return res.status(500).json({ msg: 'Provide some data' });
	}
	if (found === undefined) {
		return res.status(500).json({ msg: 'No user found' });
	}
	if (getHashedPassword(currpass) != found.password) {
		return res.status(404).json({ msg: 'invalid current password' });
	}
	if (newpass != cpass) {
		return res.status(500).json({ msg: 'new password not match' });
	}
	req.body.password = getHashedPassword(newpass);
	users.splice(users.indexOf(found), 1, { ...found, ...req.body });
	res.status(200).json(found);
};

module.exports = {
	getAllUsers,
	getUserById,
	createUser,
	deleteUser,
	updateUserInfo,
	loginUser,
	changePassword,
};
