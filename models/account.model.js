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
        min:0
    },
  }, {collection: 'accounts', versionKey: false});

  const Account = mongoose.model('account', accountSchema)

  module.exports = Account