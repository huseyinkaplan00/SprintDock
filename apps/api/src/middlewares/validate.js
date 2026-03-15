import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true, removeAdditional: 'all' })
addFormats(ajv)

export function validate(schema) {
  const validateFn = ajv.compile(schema)
  return (req, res, next) => {
    const ok = validateFn(req.body)
    if (!ok) {
      return res.status(400).json({ ok: false, errors: validateFn.errors })
    }
    return next()
  }
}
