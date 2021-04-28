import {RefreshTokenServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {MyRefreshToken, MyRefreshTokenRelations} from '../models';

export class MyRefreshTokenRepository extends DefaultCrudRepository<
  MyRefreshToken,
  typeof MyRefreshToken.prototype.id,
  MyRefreshTokenRelations
> {
  constructor(
    @inject(`datasources.${RefreshTokenServiceBindings.DATASOURCE_NAME}`)
    dataSource: juggler.DataSource,
  ) {
    super(MyRefreshToken, dataSource);
  }
}
