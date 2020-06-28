const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const db = mongoose.connection
const uri = 'mongodb+srv://admin:admin@clusterigti4-ikunu.mongodb.net/bank?retryWrites=true&w=majority'
const Account = require('../models/account.model')
const format = require('../helpers/formatNumber')

mongoose.connect(uri, {useNewUrlParser: true,  useUnifiedTopology: true, useFindAndModify: false});
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected!')
});




router.route('/api/accounts')
    .get((req, res) => {
        Account.find((err, accounts) => {
            if(err){
                res.status(404).send('Dados não encontrados')
                throw err
            }
            res.status(302).json(accounts)
        })
    })
    .post((req, res) => {
        const {agencia, conta, name, balance} = req.body
        
        Account.create({agencia, conta, name, balance}, function (err, account) {
            if (err) {
                console.log(err)
                res.status(501).send('Não foi possível realizar o cadastro')
            }
            res.status(201).send(`Account created: 
                Agência ${account.agencia}
                Conta: ${account.conta}
                Name: ${account.name}
                Saldo: ${format.formatMoney(account.balance)}`)
          });
    
        
    })


router.route('/api/account')
    .get((req, res) => {
        const {agencia, conta} = req.body
        Account.findOne({agencia, conta}, (err, account) => {
            if(err){
                res.status(404).send('Conta não localizada')
                throw err
            }
            res.status(302).json(account)
        })
})

router.route('/api/deposit')
    .put((req, res) => {
    const {agencia, conta, value} = req.body
    Account.findOneAndUpdate({agencia, conta}, {$inc: {balance:value}}, {new: true}, (err, account) => {
        if(err){
            res.status(404).send('Agência ou conta inválida')
            throw err
        }
        res.status(302).send(`Depósito realizado: 
        Data: ${new Date()}  
        Agência: ${account.agencia} 
        Conta: ${account.conta}  
        Valor: ${format.formatMoney(value)} `)
    })


})

router.route('/api/draw')
    .put((req, res) => {
    const {agencia, conta, value} = req.body
    
    Account.findOne({agencia, conta}, (err, account) => {
        if(err){
            res.status(404).send('Agência ou conta inválida')
            throw err
            
        }
        const {agencia, conta, balance} = account 
        const currentBalance = balance
        const newBalance = currentBalance - value

        Account.findOneAndUpdate({agencia, conta}, {$set: {balance: newBalance}}, {new: true, runValidators:true}, (err, data) => {
            if(err) {
                res.status(501).send('Operação inválida, saldo insuficiente')
                throw err
            }
            res.status(302).send(`Saque realizado: Data: ${new Date()} 
            Agência: ${data.agencia} 
            Conta: ${data.conta} 
            Valor: ${format.formatMoney(value)} `) 
        })
    })
    
})

router.get('/api/balance', (req, res) => {
    const {agencia, conta} = req.body

        Account.findOne({agencia, conta}, (err, account) => {
            if(err){
                res.status(404).send('Conta não localizada')
                throw err
            }
            res.status(302).send(`O saldo da conta é: ${format.formatMoney(account.balance)}`)
        })
})

router.delete('/api/deleteAccount', (req, res) => {
    const {agencia, conta} = req.body

    Account.deleteOne({agencia, conta}, (err) => {
        if(err){
            res.status(404).send('Conta não localizada')
            throw err
        }
        Account.find({agencia}, (err, accounts) => {
            if(err){
                res.status(404).send('Contas não localizadas')
                throw err
            }
            res.status(302).json(accounts)
        })
    })

})

router.put('/api/transfer', (req, res) => {
    const {agenciaDestino, contaDestino, agenciaOrigem, contaOrigem, value} = req.body
    const agencias = [agenciaDestino, agenciaOrigem]
    const contas = [contaDestino, contaOrigem]
    
    Account.find({agencia: {$in: agencias}, conta: {$in: contas}}, (err, accounts) => {
        if(err) {
            res.status(404).send('Não foi possível localizar as contas')
        }

        const destino = accounts[0]
        const origem = accounts[1]
        const taxa = destino.agencia === origem.agencia ? 0 : 8

        const newBalanceOrigem = (origem.balance) - (value + taxa)
        const newBalanceDestino = destino.balance + value

        Account.findOneAndUpdate({agencia: origem.agencia, conta: origem.conta}, {$set: {balance: newBalanceOrigem}}, {new: true, runValidators:true}, (err, account) => {
            if(err) {
                res.status(501).send('Operação inválida, saldo insuficiente')
                throw err
            }

            Account.findOneAndUpdate({agencia: destino.agencia, conta: destino.conta}, {$set: {balance: newBalanceDestino}}, {new: true, runValidators:true}, (err) => {
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

router.get('/api/averageBalance', (req, res) => {
    const {agencia} = req.body
    Account.find({agencia}, (err, accounts) => {
        if(err){
            res.status(404).send('Contas não localizadas')
            throw err
        }
        const balances = accounts.reduce((accumulator, current) => {
            return accumulator+ current.balance
        },0)
        const average = (balances/accounts.length)
        res.status(302).send(`A média de saldo das contas para a agência ${agencia} é de ${format.formatMoney(average)}`)
    })
})

router.get('/api/menoresSaldos', (req, res) => {
    const {quantidade} = req.body
    Account.find((err, accounts) => {
        if(err){
            res.status(404).send('Contas não localizadas')
            throw err
        }
        const sortedPerBalance = accounts.sort((a,b) => {
            return a.balance - b.balance
        })
        const result = sortedPerBalance.slice(0,quantidade)
        res.status(302).json(result)
    })
})

router.get('/api/maioresSaldos', (req, res) => {
    const {quantidade} = req.body
    Account.find((err, accounts) => {
        if(err){
            res.status(404).send('Contas não localizadas')
            throw err
        }
        const sortedPerBalance = accounts.sort((a,b) => {
            return b.balance - a.balance
        })
        const result = sortedPerBalance.slice(0,quantidade)
        res.status(302).json(result)
    })
})



/*FALTA SÓ ESSA*/

router.put('/api/updatePrivateAccounts', (req, res) => {
    Account.find((err, accounts) => {
        if(err) throw err

        const agencias = accounts.map(account => account.agencia)
        const uniqueAgencies = new Set(agencias)
        const agenciasNoRepeat = [...uniqueAgencies]
        const accountsPerAgencies = {}
        let biggerBalances = []
        const privateAgency = 99
        let privateAccounts = []

        agenciasNoRepeat.map(agencia => {
            return accountsPerAgencies[agencia] = []
        })
        
        
       accounts.forEach(account => {
           for (const agencia in accountsPerAgencies) {
               if (parseInt(agencia) === account.agencia) {
                   const element = accountsPerAgencies[agencia];
                   element.push(account)
                   
               }
           }
       })
        
    
    for (const agencia in accountsPerAgencies) {
        const element = accountsPerAgencies[agencia];
        
        element.sort((a,b) => {
            return b.balance - a.balance
        })
        biggerBalances.push(element)
    }
         
    let finalBalances = biggerBalances.map(arrAccounts => {
        return arrAccounts[0]
    })

    const accountsToUpdate = finalBalances.map(account => account._id)
    
    if(accountsToUpdate){
        Account.updateMany({ _id: { $in: accountsToUpdate } }, { $set: { agencia: privateAgency } }, (err, privateAccounts) => {
                if(err) {
                    res.status(501).send('Não foi possível realizar a atualização das contas') 
                    throw err
                }
                
            }
          );
    }
})
})

module.exports = router