import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './users.service';
import { PrismaService } from 'src/core/database/prisma.service';

jest.mock('generated/prisma/client', () => ({
  Prisma: {},
}));

jest.mock('src/core/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns selected user info', async () => {
    const userInfo = {
      user_id: 'user-1',
      user_email: 'user@example.com',
      user_name: 'Jane Doe',
      user_username: 'janedoe',
      user_role: 'USER',
    };
    prismaMock.user.findUnique.mockResolvedValue(userInfo);

    await expect(service.info({ userId: 'user-1' })).resolves.toEqual(userInfo);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
      },
      select: {
        user_id: true,
        user_email: true,
        user_name: true,
        user_username: true,
        user_role: true,
      },
    });
  });

  it('throws when user info is requested for a non-existent user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.info({ userId: 'missing-user' })).rejects.toThrow(
      new NotFoundException('User not found', {
        description: 'User not found',
      }),
    );
  });

  it('updates a user summary', async () => {
    const updatedUser = {
      user_id: 'user-1',
      user_name: 'Jane Updated',
      user_username: 'janeupdated',
    };
    prismaMock.user.update.mockResolvedValue(updatedUser);

    await expect(
      service.updateUser({
        userId: 'user-1',
        username: 'janeupdated',
        name: 'Jane Updated',
      }),
    ).resolves.toEqual(updatedUser);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
      },
      data: {
        user_username: 'janeupdated',
        user_name: 'Jane Updated',
      },
      select: {
        user_id: true,
        user_name: true,
        user_username: true,
      },
    });
  });

  it('changes the password when the old password matches', async () => {
    const compareMock = jest.mocked(bcrypt.compare);
    const hashMock = jest.mocked(bcrypt.hash);
    const updatedUser = {
      user_id: 'user-1',
      user_name: 'Jane Doe',
      user_username: 'janedoe',
    };

    prismaMock.user.findUnique.mockResolvedValue({
      user_password: 'stored-hash',
    });
    compareMock.mockResolvedValue(true as never);
    hashMock.mockResolvedValue('new-hash' as never);
    prismaMock.user.update.mockResolvedValue(updatedUser);

    await expect(
      service.changeUserPassword({
        userId: 'user-1',
        oldPassword: 'old-password',
        newPassword: 'new-password',
      }),
    ).resolves.toEqual(updatedUser);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
      },
      select: {
        user_password: true,
      },
    });
    expect(compareMock).toHaveBeenCalledWith('old-password', 'stored-hash');
    expect(hashMock).toHaveBeenCalledWith('new-password', 10);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
      },
      data: {
        user_password: 'new-hash',
      },
      select: {
        user_id: true,
        user_name: true,
        user_username: true,
      },
    });
  });

  it('throws when changing password for a non-existent user', async () => {
    const compareMock = jest.mocked(bcrypt.compare);
    const hashMock = jest.mocked(bcrypt.hash);
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.changeUserPassword({
        userId: 'missing-user',
        oldPassword: 'old-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(
      new NotFoundException('User not found', {
        description: 'User not found',
      }),
    );

    expect(compareMock).not.toHaveBeenCalled();
    expect(hashMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('throws when the old password does not match', async () => {
    const compareMock = jest.mocked(bcrypt.compare);

    prismaMock.user.findUnique.mockResolvedValue({
      user_password: 'stored-hash',
    });
    compareMock.mockResolvedValue(false as never);

    await expect(
      service.changeUserPassword({
        userId: 'user-1',
        oldPassword: 'wrong-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('Invalid old password.', {
        description: "Old Password from Input Don't Match with Actual Old Password",
      }),
    );

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('deletes a user by id', async () => {
    const deletedUser = {
      user_id: 'user-1',
    };
    prismaMock.user.delete.mockResolvedValue(deletedUser);

    await expect(service.deleteUser({ userId: 'user-1' })).resolves.toEqual(deletedUser);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
      },
      select: {
        user_id: true,
      },
    });
  });
});
