import {UserCredentials} from '@loopback/authentication-jwt';
import {Entity, hasOne, model, property} from '@loopback/repository';

export const MY_USER_HIDDEN_FIELDS: (keyof MyUser)[] = [
  'email',
  'emailVerified',
  'verificationToken',
  'deleted'
];

const emailJsonSchema = {
  format: 'email',
  minLength: 5,
  maxLength: 50,
  transform: ['toLowerCase'],
  errorMessage: 'Email should be between 5 and 50 characters.',
};

@model({
  settings: {
    postgresql: {table: 'user'},
    mongodb: {collection: "User"},
    hiddenProperties: MY_USER_HIDDEN_FIELDS,
    scope: {
      where: {deleted: false}
    }
  }
})
export class MyUser extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: emailJsonSchema,
    index: {
      unique: true
    }
  })
  email: string;

  @property({
    type: 'boolean',
    required: true,
    default: false
  })
  emailVerified: boolean;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
  })
  verificationToken?: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      nullable: true,
      minLength: 3,
      maxLength: 50,
      errorMessage: 'Name should be between 3 and 50 characters.',
      // errorMessage: {
      //   minLength: 'Name should be at least 3 characters.',
      //   maxLength: 'Name should not exceed 50 characters.',
      // }
    }
  })
  name?: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true}
  })
  type?: string;

  @property({
    type: 'boolean',
    required: true,
    default: false
  })
  deleted: boolean;

  @hasOne(() => UserCredentials, {keyTo: 'userId'})
  userCredentials: UserCredentials;
}
export interface MyUserRelations { }
export type MyUserWithRelations = MyUser & MyUserRelations;

@model()
export class MyUserCredentials extends Entity {
  @property({
    type: 'string',
    required: true,
    jsonSchema: emailJsonSchema,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 8,
      errorMessage: 'Password should be at least 8 characters.',
    }
  })
  password: string;
}


@model()
export class MyUserTokens extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  accessToken: string;

  @property({
    type: 'string',
    required: false,
  })
  expiresIn?: string;

  @property({
    type: 'string',
    required: false,
  })
  refreshToken?: string;
}
