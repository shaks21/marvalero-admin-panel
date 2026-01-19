import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [], // no AppService needed for this simple test
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  it('should return welcome message', () => {
    expect(appController.getRoot()).toEqual({ message: 'Welcome to the API' });
  });
});
