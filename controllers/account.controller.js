const mongoose = require('mongoose')
const db = mongoose.connection
const uri = 'mongodb+srv://admin:admin@clusterigti4-ikunu.mongodb.net/bank?retryWrites=true&w=majority'
const Account = require('../models/account.model')


mongoose.connect(uri, {useNewUrlParser: true,  useUnifiedTopology: true, useFindAndModify: false  });
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected!')
});

async function getAccounts(){
    const accounts = await Account.find()
    return accounts
}

function createAccount(account){
    const {agencia, conta, name, balance} = account
    
    Account.create({agencia, conta, name, balance}, function (err, response) {
        if (err) return handleError(err);
      });
     
}

async function getAccount({agencia, conta}){
    const account = await Account.findOne({agencia: agencia, conta:conta})
    return account
}


/*ACCOUNT METHODS*/


async function deposit(depositData){
    const {agencia, conta, value} = depositData
     const accountToDeposit = await Account.findOneAndUpdate({agencia, conta}, {$inc: {balance:value}}, {new: true})
     return accountToDeposit
    
}

async function draw(depositData){
    const {agencia, conta, value} = depositData
     const accountToDraw = await Account.updateOne({agencia, conta}, {$set:{$inc: {balance: -value}}}, {new: true, runValidators: true})
     return accountToDraw
    
}




module.exports = {getAccounts, createAccount, getAccount, deposit, draw}