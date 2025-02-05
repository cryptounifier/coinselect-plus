# coinselect-plus

[![TRAVIS](https://secure.travis-ci.org/bitcoinjs/coinselect.png)](http://travis-ci.org/bitcoinjs/coinselect)
[![NPM](http://img.shields.io/npm/v/coinselect.svg)](https://www.npmjs.org/package/coinselect)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

An unspent transaction output (UTXO) selection module for bitcoin and altcoins.

**WARNING:** Value units are in `satoshi`s, **not** Bitcoin.


## Algorithms
Module | Algorithm | Re-orders UTXOs?
-|-|-
`require('@cryptounifier/coinselect-plus')` | Blackjack, with Accumulative fallback | By Descending Value
`require('@cryptounifier/coinselect-plus/accumulative')` | Accumulative - accumulates inputs until the target value (+fees) is reached, skipping detrimental inputs | -
`require('@cryptounifier/coinselect-plus/blackjack')` | Blackjack - accumulates inputs until the target value (+fees) is matched, does not accumulate inputs that go over the target value (within a threshold) | -
`require('@cryptounifier/coinselect-plus/break')` | Break - breaks the input values into equal denominations of `output` (as provided) | -
`require('@cryptounifier/coinselect-plus/split')` | Split - splits the input values evenly between all `outputs`, any provided `output` with `.value` remains unchanged | -


**Note:** Each algorithm will add a change output if the `input - output - fee` value difference is over a dust threshold.
This is calculated independently by `utils.finalize`, irrespective of the algorithm chosen, for the purposes of safety.

**Pro-tip:** if you want to send-all inputs to an output address, `@cryptounifier/coinselect-plus/split` with a partial output (`.address` defined, no `.value`) can be used to send-all, while leaving an appropriate amount for the `fee`. 

## Example

``` javascript
let coinSelect = require('@cryptounifier/coinselect-plus')
let feeRate = 55 // satoshis per byte (It should respect the altcoin minimum relay fee)
let minimumValue = 546 // satoshis
let utxos = [
  ...,
  {
    txId: '...',
    vout: 0,
    ...,
    value: 10000,
    // For use with PSBT:
    // not needed for coinSelect, but will be passed on to inputs later
    nonWitnessUtxo: Buffer.from('...full raw hex of txId tx...', 'hex'),
    // OR
    // if your utxo is a segwit output, you can use witnessUtxo instead
    witnessUtxo: {
      script: Buffer.from('... scriptPubkey hex...', 'hex'),
      value: 10000 // 0.0001 BTC and is the exact same as the value above
    }
  }
]
let targets = [
  ...,
  {
    address: '1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm',
    value: 5000
  }
]

// ...
let { inputs, outputs, fee } = coinSelect(utxos, targets, feeRate, minimumValue)

// the accumulated fee is always returned for analysis
console.log(fee)

// .inputs and .outputs will be undefined if no solution was found
if (!inputs || !outputs) return

let psbt = new bitcoin.Psbt()

inputs.forEach(input =>
  psbt.addInput({
    hash: input.txId,
    index: input.vout,
    nonWitnessUtxo: input.nonWitnessUtxo,
    // OR (not both)
    witnessUtxo: input.witnessUtxo,
  })
)
outputs.forEach(output => {
  // watch out, outputs may have been added that you need to provide
  // an output address/script for
  if (!output.address) {
    output.address = wallet.getChangeAddress()
    wallet.nextChangeAddress()
  }

  psbt.addOutput({
    address: output.address,
    value: output.value,
  })
})
```


## License [MIT](LICENSE)
