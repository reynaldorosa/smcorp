import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'admin@caiso.com.br' })
  email: string;

  @ApiProperty({ example: 'Administrador' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role: UserRole;

  @ApiProperty({ example: 'uuid-here', required: false })
  tenantId?: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
