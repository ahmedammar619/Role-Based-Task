import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    const taskId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // If no task ID (e.g., creating a new task), allow and check organizationId in the request body
    if (!taskId) {
      return true;
    }

    // Check if task exists and belongs to user's organization
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['organization'],
    });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    // Check if user's organization matches task's organization or is a parent organization
    if (task.organizationId !== user.organizationId) {
      // Check if user's organization is a parent (for 2-level hierarchy)
      const userOrg = user.organization;
      if (!userOrg || task.organizationId !== userOrg.parentId) {
        throw new ForbiddenException(
          'You do not have access to this resource',
        );
      }
    }

    return true;
  }
}
