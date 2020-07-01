const mongoose = require('mongoose');
const { Int32 } = require('mongodb');
const Schema = mongoose.Schema

const accountSchema = new Schema({
    agencia: {
        type: Number,
        required: true,

    },
    conta: {
        type: Number,
        required: true,
        unique: true

    },
    name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 255,
    },
    balance: {
        type:Number,
        required: true,
        min: [0, 'Insuficiente founds for this operation']
    },
  }, {collection: 'accounts', versionKey: false});

  const Account = mongoose.model('account', accountSchema)

  module.exports = Account