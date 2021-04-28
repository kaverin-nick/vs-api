import {Client, expect} from '@loopback/testlab';
import {VsApiApplication} from '../..';
import {setupApplication} from './test-helper';


describe('MyUserController', () => {

  let app: VsApiApplication;
  let client: Client;

  let accessToken: string;
  let refreshToken: string;
  const testUserCredential = {
    email: 'el-niko+test@ya.ru',
    password: '11111111',
  };


  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('fails when GET /users/me without accessToken', async () => {
    await client
      .get('/users/me')
      .expect(401);
  });

  it('sign up successfully when POST /users/signup', async () => {
    const res = await client
      .post('/users/signup')
      .set("Content-Type", "application/json")
      .send(testUserCredential)
      .expect(200)
      .expect('Content-Type', /json/);
    expect(res.body).to.have.property('id');
  });

  it('fails when POST /users/login with wrong credentials', async () => {
    await client
      .post('/users/login')
      .set("Content-Type", "application/json")
      .send({
        email: 'wrong@email.com',
        password: 'wrong-password'
      })
      .expect(401);
  });

  it('receives accessToken and refreshToken successfully when POST /users/login with correct credentials', async () => {
    const res = await client
      .post('/users/login')
      .set("Content-Type", "application/json")
      .send(testUserCredential)
      .expect(200)
      .expect('Content-Type', /json/);
    expect(res.body).to.have.property('accessToken');
    expect(res.body).to.have.property('refreshToken');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('gets User successfully when GET /users/me with accessToken', async () => {
    const res = await client
      .get('/users/me')
      .set('Authorization', 'Bearer ' + accessToken)
      .expect(200)
      .expect('Content-Type', /json/);
    expect(res.body).to.have.property('id');
  });

  it('gets new accessToken when POST /users/refresh with refreshToken', async () => {
    const res = await client
      .post('/users/refresh')
      .set("Content-Type", "application/json")
      .send({refreshToken: refreshToken})
      .expect(200)
      .expect('Content-Type', /json/);
    expect(res.body).to.have.property('accessToken');
    accessToken = res.body.accessToken;
  });

  it('fails when POST /users/refresh with wrong refreshToken', async () => {
    await client
      .post('/users/refresh')
      .set("Content-Type", "application/json")
      .send({refreshToken: refreshToken + 'wrong'})
      .expect(401);
  });


  it('fails when GET /users/logout without accessToken', async () => {
    await client
      .post('/users/logout')
      .send({})
      .expect(401);
  });

  it('deletes refreshToken successfully when POST /users/logout with accessToken', async () => {
    await client
      .post('/users/logout')
      .set('Authorization', 'Bearer ' + accessToken)
      .set("Content-Type", "application/json")
      .send({refreshToken: refreshToken})
      .expect(204);
  });

  it('fails when POST /users/refresh with deleted refreshToken', async () => {
    await client
      .post('/users/refresh')
      .set("Content-Type", "application/json")
      .send({refreshToken: refreshToken})
      .expect(401);
  });

});
