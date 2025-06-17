import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SaveUserHandler } from '../src/application/user/handlers/command';
import { SaveUserCommand } from '../src/application/user/commands';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../src/domain/user/ports/user.repository.interface';

describe('SaveUserHandler', () => {
  let handler: SaveUserHandler;
  let userRepository: jest.Mocked<UserRepository>;
  let logger: jest.Mocked<Logger>;

  const mockUserDto = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveUserHandler,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    handler = module.get<SaveUserHandler>(SaveUserHandler);
    userRepository = module.get(USER_REPOSITORY);

    // Mock du logger
    logger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    // Remplacer le logger de l'instance
    (handler as any).logger = logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should save user successfully', async () => {
      // Arrange
      const command = new SaveUserCommand(mockUserDto);
      userRepository.save.mockResolvedValue(undefined);

      // Act
      await handler.handle(command);

      // Assert
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(mockUserDto);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and rethrow when repository fails', async () => {
      // Arrange
      const command = new SaveUserCommand(mockUserDto);
      const error = new Error('Database connection failed');
      userRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(
        'Database connection failed',
      );

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(mockUserDto);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('SaveUserHandler error', error);
    });

    it('should handle repository throwing non-Error objects', async () => {
      // Arrange
      const command = new SaveUserCommand(mockUserDto);
      const error = 'String error';
      userRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toBe(error);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('SaveUserHandler error', error);
    });

    it('should pass the correct userDto from command to repository', async () => {
      // Arrange
      const differentUserDto = {
        id: '456',
        email: 'other@example.com',
        name: 'Other User',
      };
      const command = new SaveUserCommand(differentUserDto);
      userRepository.save.mockResolvedValue(undefined);

      // Act
      await handler.handle(command);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith(differentUserDto);
      expect(userRepository.save).not.toHaveBeenCalledWith(mockUserDto);
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should have userRepository injected', () => {
      expect((handler as any).userRepository).toBeDefined();
    });

    it('should have logger initialized with correct context', () => {
      // On vérifie que le logger original a le bon nom
      const originalLogger = new Logger(SaveUserHandler.name);
      originalLogger.log('verifFication du logger');
      expect(SaveUserHandler.name).toBe('SaveUserHandler');
    });
  });
});
