import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { CacheService } from 'src/core/cache/cache.service';

jest.mock('generated/prisma/client', () => ({
  Prisma: {},
}));

jest.mock('src/core/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('UserController', () => {
  let controller: UserController;

  const userServiceMock = {
    info: jest.fn(),
    updateUser: jest.fn(),
    changeUserPassword: jest.fn(),
    deleteUser: jest.fn(),
  };

  const cacheMock = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const req = {
    user: {
      sub: 'user-1',
      username: 'janedoe',
      role: 'USER',
    },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: CacheService,
          useValue: cacheMock,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns cached user info when available', async () => {
    const cachedResponse = {
      success: true,
      data: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Jane Doe',
        username: 'janedoe',
        role: 'USER',
      },
      message: 'User info retrieved successfully.',
    };
    cacheMock.get.mockResolvedValue(cachedResponse);

    await expect(controller.info(req)).resolves.toEqual(cachedResponse);
    expect(cacheMock.get).toHaveBeenCalledWith('cache:users:user-1:info');
    expect(userServiceMock.info).not.toHaveBeenCalled();
    expect(cacheMock.set).not.toHaveBeenCalled();
  });

  it('loads user info and caches the response on cache miss', async () => {
    cacheMock.get.mockResolvedValue(null);
    userServiceMock.info.mockResolvedValue({
      user_id: 'user-1',
      user_email: 'user@example.com',
      user_name: 'Jane Doe',
      user_username: 'janedoe',
      user_role: 'USER',
    });
    cacheMock.set.mockResolvedValue(true);

    const response = await controller.info(req);

    expect(userServiceMock.info).toHaveBeenCalledWith({
      userId: 'user-1',
    });
    expect(response).toEqual({
      success: true,
      data: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Jane Doe',
        username: 'janedoe',
        role: 'USER',
      },
      message: 'User info retrieved successfully.',
    });
    expect(cacheMock.set).toHaveBeenCalledWith('cache:users:user-1:info', response);
  });

  it('updates the user and clears the cached info', async () => {
    userServiceMock.updateUser.mockResolvedValue({
      user_id: 'user-1',
      user_username: 'updateduser',
      user_name: 'Updated User',
    });
    cacheMock.delete.mockResolvedValue(undefined);

    await expect(
      controller.updateUser(req, {
        username: 'updateduser',
        name: 'Updated User',
      }),
    ).resolves.toEqual({
      success: true,
      data: {
        id: 'user-1',
        username: 'updateduser',
        name: 'Updated User',
      },
      message: 'User data updated successfully.',
    });

    expect(userServiceMock.updateUser).toHaveBeenCalledWith({
      userId: 'user-1',
      username: 'updateduser',
      name: 'Updated User',
    });
    expect(cacheMock.delete).toHaveBeenCalledWith('cache:users:user-1:info');
  });

  it('changes the user password', async () => {
    userServiceMock.changeUserPassword.mockResolvedValue({
      user_id: 'user-1',
      user_username: 'janedoe',
      user_name: 'Jane Doe',
    });

    await expect(
      controller.changeUserPassword(req, {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      }),
    ).resolves.toEqual({
      success: true,
      data: {
        id: 'user-1',
        username: 'janedoe',
        name: 'Jane Doe',
      },
      message: 'Password changed successfully.',
    });

    expect(userServiceMock.changeUserPassword).toHaveBeenCalledWith({
      userId: 'user-1',
      oldPassword: 'old-password',
      newPassword: 'new-password',
    });
  });

  it('deletes the user', async () => {
    userServiceMock.deleteUser.mockResolvedValue({
      user_id: 'user-1',
    });

    await expect(controller.deleteUser(req)).resolves.toEqual({
      success: true,
      data: {
        id: 'user-1',
      },
      message: 'User deleted successfully.',
    });

    expect(userServiceMock.deleteUser).toHaveBeenCalledWith({
      userId: 'user-1',
    });
  });
});
