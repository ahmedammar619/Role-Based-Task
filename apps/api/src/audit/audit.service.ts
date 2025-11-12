import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(user: User): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .leftJoinAndSelect('user.organization', 'organization')
      .orderBy('auditLog.createdAt', 'DESC')
      .take(1000); // Limit to last 1000 logs

    // Filter by organization for non-owner users
    if (user.role !== UserRole.OWNER) {
      queryBuilder.where('user.organizationId = :orgId', {
        orgId: user.organizationId,
      });
    } else {
      // Owner can see logs from their organization and child organizations
      queryBuilder.where(
        'user.organizationId = :orgId OR organization.parentId = :orgId',
        { orgId: user.organizationId },
      );
    }

    return queryBuilder.getMany();
  }
}
