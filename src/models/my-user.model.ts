import {User} from '@loopback/authentication-jwt';
import {Entity, model, property} from '@loopback/repository';

export const MY_USER_HIDDEN_FIELDS = ['email', 'emailVerified', 'verificationToken'];

@model({
  settings: {
    hiddenProperties: MY_USER_HIDDEN_FIELDS
  }
})
export class MyUser extends User {
  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true}
  })
  type?: string;
}

export interface MyUserRelations {
  // describe navigational properties here
}

export type MyUserWithRelations = MyUser & MyUserRelations;


@model()
export class MyUserCredentials extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
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
