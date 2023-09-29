import { z } from 'zod'

const create = z.object({
  price: z
    .number({
      required_error: 'price is required',
      invalid_type_error: 'price must be a string',
    })
    .min(0, `price can't be empty`),
  is_private: z.boolean({
    required_error: 'boolean is required',
    invalid_type_error: 'boolean must be a string',
  }),
})

const roleSchema = { create }

export default roleSchema
