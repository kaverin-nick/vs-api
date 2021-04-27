import {UserCredentials, UserCredentialsRepository} from '@loopback/authentication-jwt';
import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasOneRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {MyUser, MyUserRelations} from '../models';

export class MyUserRepository extends DefaultCrudRepository<
  MyUser,
  typeof MyUser.prototype.id,
  MyUserRelations
> {
  public readonly userCredentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof MyUser.prototype.id
  >;

  constructor(
    @inject('datasources.db')
    dataSource: DbDataSource,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>,
  ) {
    super(MyUser, dataSource);

    this.userCredentials = this.createHasOneRepositoryFactoryFor(
      'userCredentials',
      userCredentialsRepositoryGetter,
    );
    this.registerInclusionResolver(
      'userCredentials',
      this.userCredentials.inclusionResolver,
    );
  }

  async findCredentials(userId: string) {
    try {
      return await this.userCredentials(userId).get();
    }
    catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
