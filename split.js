var utils = require('./utils')

// split utxos between each output, ignores outputs with .value defined
module.exports = function split (utxos, outputs, feeRate, relayFee, minimumValue) {
  if (!isFinite(utils.uintOrNaN(feeRate))) return {}
  if (!isFinite(utils.uintOrNaN(relayFee))) return {}

  var bytesAccum = utils.transactionBytes(utxos, outputs)
  var fee = Math.max(feeRate * bytesAccum, relayFee)
  if (outputs.length === 0) return { fee: fee }

  var inAccum = utils.sumOrNaN(utxos)
  var outAccum = utils.sumForgiving(outputs)
  var remaining = inAccum - outAccum - fee
  if (!isFinite(remaining) || remaining < 0) return { fee: fee }

  var unspecified = outputs.reduce(function (a, x) {
    return a + !isFinite(x.value)
  }, 0)

  if (remaining === 0 && unspecified === 0) return utils.finalize(utxos, outputs, feeRate, relayFee, minimumValue)

  var splitOutputsCount = outputs.reduce(function (a, x) {
    return a + !x.value
  }, 0)
  var splitValue = Math.floor(remaining / splitOutputsCount)

  // ensure every output is either user defined, or over the threshold
  if (!outputs.every(function (x) {
    return x.value !== undefined || (splitValue > Math.max(utils.dustThreshold(x, feeRate), minimumValue))
  })) return { fee: fee }

  // assign splitValue to outputs not user defined
  outputs = outputs.map(function (x) {
    if (x.value !== undefined) return x

    // not user defined, but still copy over any non-value fields
    var y = {}
    for (var k in x) y[k] = x[k]
    y.value = splitValue
    return y
  })

  return utils.finalize(utxos, outputs, feeRate, relayFee, minimumValue)
}
