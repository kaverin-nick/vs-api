import {belongsTo, Entity, model, property} from '@loopback/repository';
import {MyUser} from '.';

@model({
  settings: {
    postgresql: {table: 'refreshtoken'},
    mongodb: {collection: "RefreshToken"}
  }
})
export class MyRefreshToken extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @belongsTo(() => MyUser)
  userId: string;

  @property({
    type: 'string',
    required: true,
  })
  refreshToken: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
  })
  userAgent?: string;

  @property({
    type: 'date',
    required: false,
    defaultFn: 'now'
  })
  created?: Date;

  @property({
    type: 'date',
    required: false,
    defaultFn: 'now'
  })
  refreshed?: Date;

  constructor(data?: Partial<MyRefreshToken>) {
    super(data);
  }
}

export interface MyRefreshTokenRelations { }
export type MyRefereshTokenWithRelations = MyRefreshToken & MyRefreshTokenRelations;
