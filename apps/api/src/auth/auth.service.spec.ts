import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOrganizationRepository = {
    findOne: jest.fn(),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        username: 'testuser',
        password: 'password123',
        role: 'admin' as any,
        organizationId: 'org-id',
      };

      const mockOrg = { id: 'org-id', name: 'Test Org' };
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        role: 'admin',
        organizationId: 'org-id',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrg);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('jwt-token');
    });

    it('should throw ConflictException if username exists', async () => {
      const registerDto = {
        username: 'existinguser',
        password: 'password123',
        role: 'admin' as any,
        organizationId: 'org-id',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
        role: 'admin',
        organizationId: 'org-id',
        organization: { id: 'org-id', name: 'Test Org' },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('jwt-token');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
