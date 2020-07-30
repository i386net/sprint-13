const mongoose = require('mongoose');
const Card = require('../models/card');
// const { cardNotFoundErrHandling } = require('../middlewares/errhandling'); // todo remove this!
const { BadRequestError } = require('../errors/BadRequestError');
const { NotFoundError } = require('../errors/NotFoundError');
const { ForbiddenError } = require('../errors/ForbiddenError');

const getCards = (req, res, next) => {
  Card.find({})
    .then((cards) => res.send({ data: cards }))
    .catch(next);
};

const createCard = (req, res, next) => {
  const { name, link } = req.body;
  Card.create({ name, link, owner: req.user._id })
    .then((card) => res.send({ data: card }))
    .catch((err) => {
      // todo удалить эти комментарии
      // if (err.name === 'ValidationError') {
      //   return res.status(400).send({ error: err.message });
      // }
      // return res.status(500).send({ error: err.message });
      let error;
      if (err.name === 'ValidationError') {
        error = new BadRequestError('Неправильные параметры карточки!');
      }
      next(error);
    });
};

const deleteCard = (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.cardId)) {
    return Card.findById(req.params.cardId)
      .orFail() // () => new Error(`Карточка с _id ${req.params.cardId} не найдена`)
      .then((card) => {
        if (card.owner.toString() === req.user._id) {
          return Card.findByIdAndDelete(card._id)
            .orFail(() => next(new NotFoundError('Карточка с таким id не найдена!')))
            .then((deletedCard) => res.send({ data: deletedCard, message: 'Карточка успешно удалена' }))
            .catch(() => next(new NotFoundError('Карточка с таким id не найдена!')));
        }
        // return res.status(403).send({ error: 'Вы не можете удалять чужие карточки' });
        return next(new ForbiddenError('Вы не можете удалять чужие карточки!'));
      })
      .catch(() => next(new NotFoundError(`Карточка с _id ${req.params.cardId} не найдена`)));
  }
  // return res.status(400).send({ error: 'Неверный формат id карточки' });
  return next(new BadRequestError('Неверный формат id карточки!'));
};

const likeCard = (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.cardId)) {
    return Card.findByIdAndUpdate(
      req.params.cardId,
      { $addToSet: { likes: req.user._id } },
      { new: true },
    )
      .orFail()
      .then((card) => res.send({ data: card }))
      .catch(() => next(new NotFoundError(`Карточка с _id ${req.params.cardId} не найдена`)));
  }
  return next(new BadRequestError('Неверный формат id карточки!'));
};

const dislikeCard = (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.cardId)) {
    return Card.findByIdAndUpdate(
      req.params.cardId,
      { $pull: { likes: req.user._id } },
      { new: true },
    )
      .orFail()
      .then((card) => res.send({ data: card }))
      .catch(() => next(new NotFoundError(`Карточка с _id ${req.params.cardId} не найдена`)));
  }
  return next(new BadRequestError('Неверный формат id карточки!'));
};

module.exports = {
  getCards, createCard, deleteCard, likeCard, dislikeCard,
};
