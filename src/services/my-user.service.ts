import {UserService} from '@loopback/authentication';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {compare} from 'bcryptjs';
// User --> MyUser
import {MyUser, MyUserWithRelations} from '../models';
// UserRepository --> MyUserRepository
import {MyUserRepository} from '../repositories';

export type Credentials = {
  email: string;
  password: string;
};

// User --> MyUser
export class MyUserService implements UserService<MyUser, Credentials> {
  constructor(
    // UserRepository --> MyUserRepository
    @repository(MyUserRepository) public userRepository: MyUserRepository,
  ) { }

  // User --> MyUser
  async verifyCredentials(credentials: Credentials): Promise<MyUser> {
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

  // User --> MyUser
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
    const foundUser = await this.userRepository.findOne({
      where: {id: id},
    });

    if (!foundUser) {
      throw new HttpErrors.Unauthorized(userNotfound);
    }
    return foundUser;
  }

}
