import Joi, { ObjectSchema } from 'joi';

const verifyEmailSchema: ObjectSchema = Joi.object().keys({
  token: Joi.string().required().messages({
    'string.base': 'Field must be valid',
    'string.required': 'Field must be valid'
  })
});

const resentEmailVerificationSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required().messages({
    'string.base': 'Field must be valid',
    'string.required': 'Field must be valid',
    'string.email': 'Field must be valid'
  }),
  userId: Joi.number().required().messages({
    'number.base': 'Field must be valid',
    'number.required': 'Field must be valid'
  })
});

export { verifyEmailSchema, resentEmailVerificationSchema };
