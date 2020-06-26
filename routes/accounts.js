const express = require('express')
const router = express.Router()
const controller = require('../controllers/account.controller')





router.route('/api/accounts')
    .get(async (req, res) => {
        const accounts = await controller.getAccounts()
        const response = accounts ? res.status(302).json(accounts) : res.status(404).send('Dados não encontrados')
        return response
    })
    .post((req, res) => {
        const {agencia, conta, name, balance} = req.body
        controller.createAccount({agencia, conta, name, balance})
        res.status(201).send('Account created!')
    })


router.route('/api/account')
    .get(async (req, res) => {
        const {agencia, conta} = req.body
        const account = await controller.getAccount({agencia, conta})
        const response = account ? res.status(302).json(account) : res.status(404).send('Conta não localizada')
        return response
})

router.route('/api/deposit')
    .put(async (req, res) => {
    const {agencia, conta, value} = req.body
    const accountDeposit = await controller.deposit({agencia, conta, value})

    const response = accountDeposit ? res.status(302).send(`Depósito realizado: Data: ${new Date()} | 
    Agência: ${accountDeposit.agencia} |  
    Conta: ${accountDeposit.conta} |  
    Valor: ${value} `) : res.status(404).send('Agência ou conta inválida')

    return response
})

router.route('/api/draw')
    .put(async (req, res) => {
    const {agencia, conta, value} = req.body
    const accountToDraw = await controller.draw({agencia, conta, value})
    
    const response = accountToDraw === false ? res.status(404).send('Dados inválidos') :
     accountToDraw.agencia === undefined || null || accountToDraw.conta == undefined || null ? 
    res.status(400).send('Valor de saque superior ao saldo da conta') :
    res.status(302).send(`Saque realizado: Data: ${new Date()} | 
    Agência: ${accountToDraw.agencia} |  
    Conta: ${accountToDraw.conta} |  
    Valor: ${value} `) 
    
    return response
})





module.exports = router