import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Organization } from '../entities/organization.entity';
import { User, UserRole } from '../entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOrganizationRepository = {
    find: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-id',
    username: 'testuser',
    password: 'hashed',
    role: UserRole.ADMIN,
    organizationId: 'org-id',
    organization: { id: 'org-id', name: 'Test Org' } as Organization,
    createdTasks: [],
    assignedTasks: [],
    auditLogs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo' as any,
        category: 'work' as any,
      };

      const mockTask = {
        id: 'task-id',
        ...createTaskDto,
        organizationId: mockUser.organizationId,
        createdById: mockUser.id,
      };

      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      const result = await service.create(createTaskDto, mockUser);

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        organizationId: mockUser.organizationId,
        createdById: mockUser.id,
      });
    });
  });

  describe('findOne', () => {
    it('should return a task if found', async () => {
      const mockTask = {
        id: 'task-id',
        title: 'Test Task',
        organizationId: mockUser.organizationId,
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.find.mockResolvedValue([]);
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      const result = await service.findOne('task-id', mockUser);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if viewer tries to delete', async () => {
      const viewerUser = { ...mockUser, role: UserRole.VIEWER };
      const mockTask = {
        id: 'task-id',
        organizationId: mockUser.organizationId,
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.find.mockResolvedValue([]);

      await expect(service.remove('task-id', viewerUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
