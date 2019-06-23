const @orioro/dataSchema = require('../../src')

console.log(@orioro/dataSchema())

document.querySelector('body').innerHTML = `Demo: ${@orioro/dataSchema()}`
