import Joi, { ObjectSchema } from 'joi';

const usernameSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Username must be of type string',
    'string.min': 'Invalid username',
    'string.max': 'Invalid username',
    'string.empty': 'Username is a required field'
  })
});

export { usernameSchema };
