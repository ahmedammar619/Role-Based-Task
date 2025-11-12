import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User, UserRole } from '../entities/user.entity';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { Organization } from '../entities/organization.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    // Create task with user's organization
    const task = this.taskRepository.create({
      ...createTaskDto,
      organizationId: user.organizationId,
      createdById: user.id,
    });

    const savedTask = await this.taskRepository.save(task);

    // Create audit log
    await this.createAuditLog(
      user.id,
      AuditAction.CREATE,
      'task',
      savedTask.id,
      `Created task: ${savedTask.title}`,
    );

    return savedTask;
  }

  async findAll(user: User): Promise<Task[]> {
    // Get accessible organization IDs based on role and hierarchy
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    // Get tasks from accessible organizations
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.organization', 'organization')
      .where('task.organizationId IN (:...orgIds)', { orgIds: accessibleOrgIds })
      .orderBy('task.order', 'ASC')
      .addOrderBy('task.createdAt', 'DESC')
      .getMany();

    // Create audit log
    await this.createAuditLog(
      user.id,
      AuditAction.READ,
      'task',
      undefined,
      `Listed tasks`,
    );

    return tasks;
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check organization access
    await this.checkOrganizationAccess(task, user);

    // Create audit log
    await this.createAuditLog(
      user.id,
      AuditAction.READ,
      'task',
      task.id,
      `Viewed task: ${task.title}`,
    );

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check organization access
    await this.checkOrganizationAccess(task, user);

    // Check role permissions for update
    if (user.role === UserRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot update tasks');
    }

    // Update task
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    // Create audit log
    await this.createAuditLog(
      user.id,
      AuditAction.UPDATE,
      'task',
      task.id,
      `Updated task: ${task.title}`,
    );

    return updatedTask;
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check organization access
    await this.checkOrganizationAccess(task, user);

    // Check role permissions for delete
    if (user.role === UserRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot delete tasks');
    }

    // Only Owner and Admin can delete, and Admin can only delete own tasks
    if (user.role === UserRole.ADMIN && task.createdById !== user.id) {
      throw new ForbiddenException('Admins can only delete their own tasks');
    }

    await this.taskRepository.remove(task);

    // Create audit log
    await this.createAuditLog(
      user.id,
      AuditAction.DELETE,
      'task',
      id,
      `Deleted task: ${task.title}`,
    );
  }

  private async checkOrganizationAccess(
    task: Task,
    user: User,
  ): Promise<void> {
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    if (!accessibleOrgIds.includes(task.organizationId)) {
      throw new ForbiddenException(
        'You do not have access to this resource',
      );
    }
  }

  private async getAccessibleOrganizationIds(user: User): Promise<string[]> {
    const orgIds: string[] = [user.organizationId];

    // If Owner, can see tasks from child organizations (2-level hierarchy)
    if (user.role === UserRole.OWNER) {
      const childOrgs = await this.organizationRepository.find({
        where: { parentId: user.organizationId },
      });

      childOrgs.forEach((org) => orgIds.push(org.id));
    }

    return orgIds;
  }

  private async createAuditLog(
    userId: string,
    action: AuditAction,
    resource: string,
    resourceId?: string,
    details?: string,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
      details,
    });

    await this.auditLogRepository.save(auditLog);
  }
}
