var utils = require('./utils')

// break utxos into the maximum number of 'output' possible
module.exports = function broken (utxos, output, feeRate, relayFee, minimumValue) {
  if (!isFinite(utils.uintOrNaN(feeRate))) return {}
  if (!isFinite(utils.uintOrNaN(relayFee))) return {}

  var bytesAccum = utils.transactionBytes(utxos, [])
  var value = utils.uintOrNaN(output.value)
  var inAccum = utils.sumOrNaN(utxos)
  if (!isFinite(value) ||
      !isFinite(inAccum)) return { fee: Math.max(feeRate * bytesAccum, relayFee) }

  var outputBytes = utils.outputBytes(output)
  var outAccum = 0
  var outputs = []

  while (true) {
    var fee = Math.max(feeRate * (bytesAccum + outputBytes), relayFee)

    // did we bust?
    if (inAccum < (outAccum + fee + value)) {
      // premature?
      if (outAccum === 0) return { fee: fee }

      break
    }

    bytesAccum += outputBytes
    outAccum += value
    outputs.push(output)
  }

  return utils.finalize(utxos, outputs, feeRate, relayFee, minimumValue)
}
