import {UserService} from '@loopback/authentication';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {compare} from 'bcryptjs';
import {MyUser, MyUserCredentials, MyUserWithRelations} from '../models';
import {MyUserRepository} from '../repositories';

export class MyUserService implements UserService<MyUser, MyUserCredentials> {
  constructor(
    @repository(MyUserRepository) public userRepository: MyUserRepository,
  ) { }

  async verifyCredentials(credentials: MyUserCredentials): Promise<MyUser> {
    const invalidCredentialsError = 'Invalid email or password.';

    const foundUser = await this.userRepository.findOne({
      where: {email: credentials.email},
    });
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const credentialsFound = await this.userRepository.findCredentials(
      foundUser.id,
    );
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const passwordMatched = await compare(
      credentials.password,
      credentialsFound.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    return foundUser;
  }

  convertToUserProfile(user: MyUser): UserProfile {
    return {
      [securityId]: user.id.toString(),
      name: user.name,
      id: user.id,
      email: user.email,
    };
  }

  async findUserById(id: string): Promise<MyUser & MyUserWithRelations> {
    const userNotfound = 'invalid User';
    const foundUser = await this.userRepository.findById(id);
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(userNotfound);
    }
    return foundUser;
  }

}
