var utils = require('./utils')

// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
module.exports = function accumulative(utxos, outputs, feeRate, relayFee, minimumValue) {
  if (!isFinite(utils.uintOrNaN(feeRate))) return {}
  if (!isFinite(utils.uintOrNaN(relayFee))) return {}

  var bytesAccum = utils.transactionBytes([], outputs)

  var inAccum = 0
  var inputs = []
  var outAccum = utils.sumOrNaN(outputs)

  for (var i = 0; i < utxos.length; ++i) {
    var utxo = utxos[i]
    var utxoBytes = utils.inputBytes(utxo)
    var utxoFee = Math.max(feeRate * utxoBytes, relayFee)
    var utxoValue = utils.uintOrNaN(utxo.value)

    // skip detrimental input
    if (utxoFee > utxo.value) {
      if (i === utxos.length - 1) return { fee: Math.max(feeRate * (bytesAccum + utxoBytes), relayFee) }
      continue
    }

    bytesAccum += utxoBytes
    inAccum += utxoValue
    inputs.push(utxo)

    // go again?
    var fee = Math.max(feeRate * bytesAccum, relayFee)
    if (inAccum < outAccum + fee) continue

    return utils.finalize(inputs, outputs, feeRate, relayFee, minimumValue)
  }

  return { fee: Math.max(feeRate * bytesAccum, relayFee) }
}
