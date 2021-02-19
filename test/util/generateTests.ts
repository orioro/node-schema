export const _generateTests = (expectations, fn) => {
  expectations.forEach(([input, result]) => {
    const inputLabel = _valueLabel(input)
    const resultLabel = _validationResultLabel(result)

    const testLabel = `validate(schema, ${inputLabel}) -> ${resultLabel}`

    if (result === null) {
      test(testLabel, () => expect(fn(input)).toEqual(null))
    } else {
      test(testLabel, () =>
        expect(fn(input)).toMatchObject(result)
      )
    }
  })
}

export const _valueLabel = (value) =>
  typeof value === 'string'
    ? `'${value}'`
    : typeof value === 'object'
    ? Object.prototype.toString.call(value)
    : String(value)

export const _validationResultLabel = (result) =>
  result === null ? 'null' : result.map((r) => r.code).join(', ')
