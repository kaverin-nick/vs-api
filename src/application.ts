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
import {MyUserRepository} from './repositories';
import {MySequence} from './sequence';
import {MyUserService} from './services';


export {ApplicationConfig};

export class WakeApiApplication extends BootMixin(
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
    // Bind datasource
    this.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);
    this.dataSource(DbDataSource, RefreshTokenServiceBindings.DATASOURCE_NAME);
    // Bind user service and repository
    this.bind(UserServiceBindings.USER_SERVICE).toClass(MyUserService);
    this.bind(UserServiceBindings.USER_REPOSITORY).toClass(MyUserRepository);
    // for jwt access token
    this.bind(TokenServiceBindings.TOKEN_SECRET).to("VS-API-SECRET-FOR-TOKEN");
    this.bind(RefreshTokenServiceBindings.REFRESH_SECRET).to("VS-API-SECRET-FOR-REFRESH-TOKEN");
    // for jwt access token expiration
    //this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to("<Expiration Time in sec>");
    //this.bind(RefreshTokenServiceBindings.REFRESH_EXPIRES_IN).to("<Expiration Time in sec>");
  }
}
