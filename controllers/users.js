const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/user');
const { key } = require('../appdata/jwtdata');

const getUsers = (req, res) => {
  User.find({})
    .then((users) => res.send({ data: users }))
    .catch((err) => res.status(500).send({ error: err.message }));
};

const getUser = (req, res) => {
  if (mongoose.Types.ObjectId.isValid(req.params.userId)) {
    return User.findById(req.params.userId)
      .orFail(
        () => new Error(`Пользователь с таким _id ${req.params.userId} не найден`),
      )
      .then((user) => res.send({ data: user }))
      .catch((err) => res.status(404).send({ error: err.message }));
  }
  return res.status(400).send({ error: 'Неверный формат id пользователя' });
};

const createUser = (req, res) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  if (validator.isEmpty(password) || !validator.isLength(password, { min: 8, max: 16 })) {
    return res.status(401).send({ error: `Пароль должен быть от 8 до 16 знаков, длина вашего пароля: ${password.length}` });
  }
  return bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, about, avatar, email, password: hash,
    }))
    .then((user) => res.send({
      data: {
        name: user.name, about: user.about, avatar: user.avatar, email: user.email,
      },
    }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(400).send({ error: err.message });
      }
      return res.status(500).send({ error: err.message });
    });
};

const updateUser = (req, res) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    {
      new: true,
      runValidators: true,
    },
  )
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(400).send({ error: err.message });
      }
      return res.status(500).send({ error: err.message });
    });
};

const updateAvatar = (req, res) => {
  const { avatar } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { avatar },
    {
      new: true,
      runValidators: true,
    },
  )
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(400).send({ error: err.message });
      }
      return res.status(500).send({ error: err.message });
    });
};

const login = (req, res) => User.findUserByCredentials(req.body.email, req.body.password)
  .then((user) => {
    const token = jwt.sign({ _id: user._id }, key, { expiresIn: '7d' });
    res.send(token);
  })
  .catch((err) => res.status(401).send({ error: err.message }));

module.exports = {
  getUsers, getUser, createUser, updateAvatar, updateUser, login,
};
