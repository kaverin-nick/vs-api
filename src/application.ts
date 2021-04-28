import {AuthenticationComponent} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  RefreshTokenServiceBindings,
  TokenServiceBindings,

  UserServiceBindings
} from '@loopback/authentication-jwt';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {DbDataSource} from './datasources';
import {MyRefreshTokenRepository, MyUserRepository} from './repositories';
import {MySequence} from './sequence';
import {MyUserService} from './services';
import {MyRefreshTokenService} from './services/my-refreshtoken.service';


export {ApplicationConfig};

export class VsApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Authentication

    // Mount authenticationsystem & jwt component
    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);

    // Binds for User
    this.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);
    this.bind(UserServiceBindings.USER_SERVICE).toClass(MyUserService);
    this.bind(UserServiceBindings.USER_REPOSITORY).toClass(MyUserRepository);

    // Binds for Token
    this.bind(TokenServiceBindings.TOKEN_SECRET).to("VS-API-SECRET-FOR-TOKEN");
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to('86400'); // 24 часа = 86400

    // Binds for RefreshToken
    this.dataSource(DbDataSource, RefreshTokenServiceBindings.DATASOURCE_NAME);
    this.bind(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE).toClass(MyRefreshTokenService);
    this.bind(RefreshTokenServiceBindings.REFRESH_REPOSITORY).toClass(MyRefreshTokenRepository);
    this.bind(RefreshTokenServiceBindings.REFRESH_SECRET).to("VS-API-SECRET-FOR-REFRESH-TOKEN");
    this.bind(RefreshTokenServiceBindings.REFRESH_EXPIRES_IN).to("31536000"); // 1 год

  }
}
