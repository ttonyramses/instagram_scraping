import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserDto } from '../dto/user.dto';
import { CreateUserCommand } from '../../../application/user/commands/create-user.command';
import { UpdateUserCommand } from '../../../application/user/commands/update-user.command';
import { GetUserQuery } from '../../../application/user/queries/get-user.query';
import { CreateUserHandler } from '../../../application/user/handlers/create-user.handler';
import { UpdateUserHandler } from '../../../application/user/handlers/update-user.handler';
import { GetUserHandler } from '../../../application/user/handlers/get-user.handler';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
    private readonly updateUserHandler: UpdateUserHandler,
    private readonly getUserHandler: GetUserHandler,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const command = new CreateUserCommand(
      createUserDto.id,
      createUserDto.name,
      createUserDto.biography,
      createUserDto.instagramId,
      createUserDto.facebookId,
      createUserDto.category,
      createUserDto.externalUrl,
      createUserDto.profileUrl,
    );

    const user = await this.createUserHandler.handle(command);
    return this.mapToDto(user);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserDto> {
    const query = new GetUserQuery(id);
    const user = await this.getUserHandler.handle(query);
    return this.mapToDto(user);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    const command = new UpdateUserCommand(
      id,
      updateUserDto.name,
      updateUserDto.biography,
      updateUserDto.category,
    );

    const user = await this.updateUserHandler.handle(command);
    return this.mapToDto(user);
  }

  private mapToDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      biography: user.biography,
      json: user.json,
      nbFollowers: user.nbFollowers,
      nbFollowings: user.nbFollowings,
      nbPublications: user.nbPublications,
      instagramId: user.instagramId,
      facebookId: user.facebookId,
      category: user.category,
      externalUrl: user.externalUrl,
      profileUrl: user.profileUrl,
      hasInfo: user.hasInfo,
      hasFollowerProcess: user.hasFollowerProcess,
      hasFollowingProcess: user.hasFollowingProcess,
      enable: user.enable,
      maxIdFollower: user.maxIdFollower,
      maxIdFollowing: user.maxIdFollowing,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
