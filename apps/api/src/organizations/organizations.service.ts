import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
  ): Promise<Organization> {
    const { name } = createOrganizationDto;

    // Check if organization already exists
    const existingOrg = await this.organizationRepository.findOne({
      where: { name },
    });

    if (existingOrg) {
      throw new ConflictException('Organization already exists');
    }

    const organization = this.organizationRepository.create(
      createOrganizationDto,
    );

    return this.organizationRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find({
      relations: ['parent', 'children'],
    });
  }

  async findOne(id: string): Promise<Organization> {
    return this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'users'],
    });
  }
}
