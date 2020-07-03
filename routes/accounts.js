const express = require('express')
const router = express.Router()
const controller = require('../controllers/account.controller')

router.route('/api/accounts')
    .get(controller.getAccounts) 
    .post(controller.createAccount) 


router.get('/api/account', controller.getAccount) 

router.put('/api/deposit', controller.deposit) 

router.put('/api/draw', controller.draw) 

router.get('/api/balance', controller.getBalance) 

router.delete('/api/deleteAccount', controller.deleteAccount) 

router.put('/api/transfer', controller.transfer) 
 
router.get('/api/averageBalance', controller.averageBalance) 

router.get('/api/lowerBalance', controller.lowerBalance) 

router.get('/api/biggerBalances', controller.biggerBalances) 

router.put('/api/privateAccounts', controller.privateAccounts) 

module.exports = router