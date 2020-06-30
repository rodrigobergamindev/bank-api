const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const db = mongoose.connection
const uri = 'mongodb+srv://admin:admin@clusterigti4-ikunu.mongodb.net/bank?retryWrites=true&w=majority'
const Account = require('../models/account.model')
const format = require('../helpers/formatNumber')
const { formatMoney } = require('../helpers/formatNumber')

mongoose.connect(uri, {useNewUrlParser: true,  useUnifiedTopology: true, useFindAndModify: false});
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected!')
});




router.route('/api/accounts')
    .get(async (req, res) => {
        try {
        const accounts = await Account.find()
        res.status(200).json(accounts)
        } catch (error) {
            console.log('Não foi possível localizar as contas, erro: ' + error)
            res.status(404).send('Contas não localizadas')
        }
    }) //OK
    .post(async (req, res) => {
        try {
            const {agencia, conta, name, balance} = req.body
            const account = await  Account.create({agencia, conta, name, balance})
            res.status(201).send(`Account created: 
                    Agência ${account.agencia}
                    Conta: ${account.conta}
                    Name: ${account.name}
                    Saldo: ${format.formatMoney(account.balance)}`)
        } catch (error) {
            console.log('Não é possível criar uma nova conta: ' + error)
            res.status(501).send('Não foi possível realizar o cadastro')
        }
        
    }) //OK


router.route('/api/account')
    .get(async (req, res) => {
        const {name} = req.body
        try {
            const account = await Account.findOne({name})
            res.status(200).json(account)
        } catch (error) {
            console.log('Conta não localizada: ' + error)
            res.status(404).send('Conta não localizada')
            
        }
}) //OK

router.route('/api/deposit')
    .put(async (req, res) => {
        try {
            const {agencia, conta, value} = req.body
            const account = await Account.findOneAndUpdate({agencia, conta}, {$inc: {balance: value}}, {new: true})
            res.status(200).send(`Depósito realizado: 
            Data: ${new Date()}  
            Agência: ${account.agencia} 
            Conta: ${account.conta}
            Favorecido: ${account.name}  
            Valor: ${format.formatMoney(value)} `)

        } catch (error) {
            console.log('Não foi possível realizar a operação de depósito: ' + error)
            res.status(404).send('Agência ou conta inválida')
        }
}) //OK

router.route('/api/draw')
    .put(async (req, res) => {
        try {
            const {agencia, conta, value} = req.body
                const account = await Account.findOneAndUpdate({agencia, conta}, {$min: {balance: 0}, $inc: {balance: - (value + 1)}}, {new: true, runValidators:true})
                    res.status(200).send(
                    `Saque realizado: 
                    Data: ${new Date()} 
                    Agência: ${account.agencia} 
                    Conta: ${account.conta} 
                    Valor: ${format.formatMoney(value)} 
                    Novo saldo: ${formatMoney(account.balance)}
                    `) 
        } catch (error) {
            console.log('Erro ao realizar operação de saque: ' + error)
            res.status(500).send('Erro ao realizar operação de saque')
        }
    
}) //OK

router.get('/api/balance', async (req, res) => {
    try {
        const {agencia, conta} = req.body
        const account = await Account.findOne({agencia, conta})
        res.status(200).send(`O saldo da conta é: ${format.formatMoney(account.balance)}`)
    } catch (error) {
        console.log('Erro ao consultar saldo: ' + error)
        res.status(500).send('Erro ao realizar operação')
    }
}) //OK

router.delete('/api/deleteAccount', async (req, res) => {
    try {
        const {agencia, conta} = req.body
        Account.deleteOne({agencia, conta})
        Account.find({agencia}, (err, accounts) => {
                if(err){
                    res.status(404).send('Contas não localizadas')
                    throw err
                }
                res.status(200).json(accounts)
            })
    } catch (error) {
        console.log('Erro ao excluir conta: ' + error)
        res.status(500).send('Erro ao excluir conta')
    }
}) //OK

router.put('/api/transfer', (req, res) => {
    const {agencia,contaDestino,contaOrigem, value} = req.body
    const contas = [contaDestino, contaOrigem]
    
    Account.find({conta: {$in: contas}}, (err, accounts) => {
        if(err) {
            res.status(404).send('Não foi possível localizar as contas')
        }

        const destino = accounts[1]
        const origem = accounts[0]
        const taxa = destino.agencia === origem.agencia ? 0 : 8
        console.log(accounts)
        const newBalanceOrigem = (origem.balance) - (value + taxa)
        const newBalanceDestino = destino.balance + value

        Account.findOneAndUpdate({conta: origem.conta}, {$set: {balance: newBalanceOrigem}}, {new: true, runValidators:true}, (err, account) => {
            if(err) {
                res.status(501).send('Operação inválida, saldo insuficiente')
                throw err
            }

            Account.findOneAndUpdate({conta: destino.conta}, {$set: {balance: newBalanceDestino}}, {new: true, runValidators:true}, (err) => {
                if(err) {
                    throw err
                }
                res.status(302).send(`Transferência realizada com sucesso: 
                Data: ${new Date()} 
                Novo saldo: ${format.formatMoney(account.balance)} `) 
            })
        })

    })
})

router.get('/api/averageBalance', async (req, res) => {
    try {
        const {agencia} = req.body
        const average = await Account.aggregate([
            {$match: {agencia}},
            {$group: {_id:null, media: {$avg: '$balance'}}}
    ])
        res.status(200).send(`A média de saldos para a agência: ${agencia} é de ${formatMoney(average[0].media)}`)
    } catch (error) {
        console.log('Erro ao consultar média de saldos: ' + error)
        res.status(500).send('Não foi possível consultar a média de saldos')
    }
    
}) //OK

router.get('/api/lowerBalance', async (req, res) => {
    try {
        const {quantidade} = req.body
        const accounts = await Account.aggregate([
            {$limit: quantidade},
            {$sort: {balance:1}}
        ])
            res.status(200).json(accounts)
        
    } catch (error) {
        console.log('Erro ao consultar contas com menores saldos: ' + error)
        res.status(500).send('Não foi possível consultar as contas com menores saldos')
    }
       
}) //OK

router.get('/api/biggerBalances', async (req, res) => {
    try {
        const {quantidade} = req.body
        const accounts = await Account.aggregate([
            {$limit: quantidade},
            {$sort: {balance:-1}}
        ])
            res.status(200).json(accounts)
        
    } catch (error) {
        console.log('Erro ao consultar contas com maiores saldos: ' + error)
        res.status(500).send('Não foi possível consultar as contas com maiores saldos')
    }
}) //OK

router.put('/api/privateAccounts', async (req, res) => {
    try {
        const lower = await Account.aggregate([
            {
                $group: {
                    _id:"$agencia",
                    balance: {$max: '$balance'}}
        }
    ])
        res.status(200).json(lower)
    } catch (error) {
        console.log('Erro ao consultar menor saldo: ' + error)
        res.status(500).send('Não foi possível consultar o menor saldo')
    }
})

module.exports = router