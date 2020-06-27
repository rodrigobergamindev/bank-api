  
const formatterCurrency = Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatter = Intl.NumberFormat('pt-BR')


function formatMoney(value){
    return formatterCurrency.format(value)
}

function format(value){
    return formatter.format(value)
}
module.exports = {formatMoney, format}