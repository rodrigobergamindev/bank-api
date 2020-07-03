const mongoose = require('mongoose')
const Account = require('../models/account.model')
const {formatMoney} = require('../helpers/formatNumber')
require('dotenv/config')
const db = mongoose.connection
const uri = process.env.URI_CONNECTION

const openConnection = () => {
    mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    });
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        console.log('connected!')
    });

}

const closeConnection = () => {
    if(db.close()) {
        console.log('connection closed')
    }
}

const getAccounts = async (req, res) => {

    try {

        openConnection()
        const accounts = await Account.find()
        res.status(200).json(accounts)
        closeConnection()
    } catch (error) {
        console.log('Não foi possível localizar as contas, erro: ' + error)
        res.status(404).send('Contas não localizadas')
    }
}

const createAccount = async (req, res) => {

    //CRIAÇÃO DE UMA CONTA

    try {
        openConnection()
        const {
            agencia,
            conta,
            name,
            balance
        } = req.body
        const account = await Account.create({
            agencia,
            conta,
            name,
            balance
        })
        res.status(201).send(`Account created: 
                Agência ${account.agencia}
                Conta: ${account.conta}
                Name: ${account.name}
                Saldo: ${account.balance}`)
        closeConnection()
    } catch (error) {
        console.log('Não é possível criar uma nova conta: ' + error)
        res.status(501).send('Não foi possível criar uma nova conta, revise os dados informados e tente novamente')
    }

}


const getAccount = async (req, res) => {

    //RETORNA INFORMAÇÕES DE UMA CONTA COM BASE NO NOME

    try {
        openConnection()
        const {name} = req.body
        const account = await Account.findOne({
            name
        })
        res.status(200).json(account)
        closeConnection()
    } catch (error) {
        console.log('Conta não localizada: ' + error)
        res.status(404).send('Conta não localizada')

    }
}

const deposit = async (req, res) => {

    //Operação de depósito

    try {
        openConnection()

        const {agencia,conta,value} = req.body
        const account = await Account.findOneAndUpdate({
            agencia,
            conta
        }, {
            $inc: {
                balance: value
            }
        }, {
            new: true
        }) //incrementando o saldo da conta
        res.status(200).send(`Depósito realizado: 
        Data: ${new Date()}  
        Agência: ${account.agencia} 
        Conta: ${account.conta}
        Favorecido: ${account.name}  
        Valor: ${format.formatMoney(value)} `)

        closeConnection()
    } catch (error) {
        console.log('Não foi possível realizar a operação de depósito: ' + error)
        res.status(404).send('Agência ou conta inválida')
    }
}

const draw = async (req, res) => {

    //OPERAÇÃO DE SAQUE

    try {
        openConnection()

        const {conta,value} = req.body
        const account = await Account.findOne({
            conta
        })
        const newBalance = account.balance - (value + 1) //Não foi encontrada uma forma de validar uma operação de atualização com $set e $inc ao mesmo tempo

        if(newBalance >=0){
            const draw = await Account.findOneAndUpdate({
                conta
            }, {
                $set: {
                    balance: newBalance
                }
            }, {
                new: true,
                runValidators: true
            })
            res.status(200).send(
                `Saque realizado: 
                    Data: ${new Date()} 
                    Agência: ${draw.agencia} 
                    Conta: ${draw.conta} 
                    Valor: ${formatMoney(value)} 
                    Novo saldo: ${formatMoney(draw.balance)}
                    `)
            
        }else{
            res.status(400).send('Saldo insuficiente para saque')
        }
        closeConnection()
    } catch (error) {
        console.log('Erro ao realizar operação de saque: ' + error)
        res.status(500).send('Erro ao realizar operação de saque')
    }

}

const getBalance = async (req, res) => {

    //RETORNAR O SALDO DE UMA CONTA

    try {
        openConnection()
        const {conta} = req.body
        const account = await Account.findOne({
            conta
        })
        res.status(200).send(`O saldo da conta é: ${format.formatMoney(account.balance)}`)
        closeConnection()
    } catch (error) {
        console.log('Erro ao consultar saldo: ' + error)
        res.status(500).send('Erro ao realizar operação')
    }
}

const deleteAccount = async (req, res) => {

    //EXCLUIR UMA CONTA E RETORNAR A RELAÇÃO DE CONTAS DAQUELA AGÊNCIA

    try {
        openConnection()
        const {agencia,conta} = req.body
        Account.deleteOne({
            agencia,
            conta
        })
        Account.find({
            agencia
        }, (err, accounts) => {
            if (err) {
                res.status(404).send('Contas não localizadas')
                throw err
            }
            res.status(200).json(accounts)
        closeConnection()
        })
    } catch (error) {
        console.log('Erro ao excluir conta: ' + error)
        res.status(500).send('Erro ao excluir conta')
    }
}

const transfer = async (req, res) => {

    //TRANSFERÊNCIA ENTRE DUAS CONTAS

    try {
        openConnection()

        const {
            contaDestino,
            contaOrigem,
            value
        } = req.body

        const origem = await Account.findOne({
            conta: contaOrigem
        })
        const destino = await Account.findOne({
            conta: contaDestino
        })
        const taxa = origem.agencia === destino.agencia ? 0 : 8
        const newBalanceOrigem = origem.balance - (value + taxa)
        const newBalanceDestino = destino.balance + value

        /*VALIDATION*/
        if (newBalanceOrigem >= 0) {
            const transfer = await Account.bulkWrite([{
                    updateOne: {
                        filter: {
                            conta: contaOrigem
                        },
                        update: {
                            $set: {
                                balance: newBalanceOrigem
                            }
                        }
                    }
                },
                {
                    updateOne: {
                        filter: {
                            conta: contaDestino
                        },
                        update: {
                            $set: {
                                balance: newBalanceDestino
                            }
                        }
                    }
                }
            ])

            res.status(200).send(`
            Transferência realizada com sucesso!
            Data: ${new Date()}
            Agência: ${origem.agencia}
            Conta: ${origem.conta}
            Titular: ${origem.name}
            Novo saldo: ${formatMoney(newBalanceOrigem)}
            `)
        } else {
            res.status(400).send('Saldo insuficiente para realizar a transferência')
        }
        closeConnection()
    } catch (error) {
        console.log("Não foi possível realizar a operação de transferência: " + error)
        res.status(500).send('Não foi possível realizar a operação de transferência')
    }

}

const averageBalance = async (req, res) => {

    //MÉDIA DE SALDOS DE UMA DETERMINADA AGÊNCIA

    try {
        openConnection()

        const {agencia} = req.body
        const average = await Account.aggregate([{
                $match: {
                    agencia
                }
            },
            {
                $group: {
                    _id: null,
                    media: {
                        $avg: '$balance'
                    }
                }
            }
        ])
        res.status(200).send(`A média de saldos para a agência: ${agencia} é de ${formatMoney(average[0].media)}`)
        closeConnection()
    } catch (error) {
        console.log('Erro ao consultar média de saldos: ' + error)
        res.status(500).send('Não foi possível consultar a média de saldos')
    }

}

const lowerBalance = async (req, res) => {

    //RETORNAR AS CONTAS EM ORDEM DE MENOR SALDO COM BASE NA QUANTIDADE ESPECIFICADA PELO USUÁRIO

    try {
        openConnection()

        const {
            quantidade
        } = req.body
        const accounts = await Account.aggregate([{
                $limit: quantidade
            },
            {
                $sort: {
                    balance: 1
                }
            }
        ])
        res.status(200).json(accounts)

        closeConnection()
    } catch (error) {
        console.log('Erro ao consultar contas com menores saldos: ' + error)
        res.status(500).send('Não foi possível consultar as contas com menores saldos')
    }

}

const biggerBalances = async (req, res) => {
    //RETORNAR AS CONTAS EM ORDEM DE MAIOR SALDO COM BASE NA QUANTIDADE ESPECIFICADA PELO USUÁRIO
    try {
        openConnection()

        const {
            quantidade
        } = req.body
        const accounts = await Account.aggregate([{
                $limit: quantidade
            },
            {
                $sort: {
                    balance: -1
                }
            }
        ])
        res.status(200).json(accounts)

        closeConnection()
    } catch (error) {
        console.log('Erro ao consultar contas com maiores saldos: ' + error)
        res.status(500).send('Não foi possível consultar as contas com maiores saldos')
    }
}

const privateAccounts = async (req, res) => {

    //TRANSFERIR PARA A AGÊNCIA PRIVATE AS CONTAS COM MAIORES SALDOS DE CADA AGÊNCIA

    try {
        openConnection()

        const accounts = await Account.aggregate([{
                $group: {
                    _id: '$agencia', // Group By Expression
                    balance: {
                        $max: '$balance'
                    }
                }
            },
            {
                $sort: {
                    balance: -1
                }
            }
        ])

        const biggerBalances = accounts.filter(account => account._id !== 99)
        const privateAgencyNumber = 99

        biggerBalances.forEach(async (account) => {
            await Account.findOneAndUpdate({
                agencia: account._id,
                balance: balance
            }, {
                $set: {
                    agencia: privateAgencyNumber
                }
            }, {
                new: true,
                runValidators: true
            })

        })

        const privateAccounts = await Account.find({
            agencia: privateAgencyNumber
        })
        res.status(200).json(privateAccounts)

        closeConnection()
    } catch (error) {
        console.log('Erro ao consultar as contas da agência private: ' + error)
        res.status(500).send('Não foi possível consultar as contas da agência private')
    }
}


module.exports = {
    privateAccounts,
    biggerBalances,
    lowerBalance,
    averageBalance,
    transfer,
    deleteAccount,
    getBalance,
    draw,
    deposit,
    getAccount,
    createAccount,
    getAccounts
}