import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { LoginDto, RegisterDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: Partial<User> }> {
    const { username, password, role, organizationId } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      role,
      organizationId,
    });

    await this.userRepository.save(user);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId,
    };

    const access_token = this.jwtService.sign(payload);

    // Create audit log
    await this.createAuditLog(
      user.id,
      AuditAction.CREATE,
      'user',
      user.id,
      'User registered',
    );

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const { username, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Log failed login attempt
      await this.createAuditLog(
        user.id,
        AuditAction.ACCESS_DENIED,
        'auth',
        null,
        'Failed login attempt',
        ipAddress,
        userAgent,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId,
    };

    const access_token = this.jwtService.sign(payload);

    // Create audit log
    await this.createAuditLog(
      user.id,
      AuditAction.LOGIN,
      'auth',
      user.id,
      'User logged in',
      ipAddress,
      userAgent,
    );

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async createAuditLog(
    userId: string,
    action: AuditAction,
    resource: string,
    resourceId: string,
    details: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });

    await this.auditLogRepository.save(auditLog);
  }
}
